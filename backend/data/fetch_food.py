import os
import requests
import json
import base64
from datetime import datetime
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import logging
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', handlers=[logging.StreamHandler()]
)

# Load environment variables
load_dotenv()


class Configs:
    def __init__(self):
        self.CONSUMER_KEY = os.environ.get('CONSUMER_KEY')
        self.CONSUMER_SECRET = os.environ.get('CONSUMER_SECRET')
        self.REFRESH_TOKEN_URL = 'https://api.princeton.edu:443/token'
        self.STUDENT_APP_BASE_URL = 'https://api.princeton.edu:443/student-app'
        self.ACCESS_TOKEN = None
        self._refresh_token(grant_type='client_credentials')

    def _refresh_token(self, **kwargs):
        try:
            headers = {
                'Authorization': 'Basic '
                + base64.b64encode(f'{self.CONSUMER_KEY}:{self.CONSUMER_SECRET}'.encode('utf-8')).decode('utf-8')
            }
            response = requests.post(self.REFRESH_TOKEN_URL, data=kwargs, headers=headers)
            response.raise_for_status()
            token_data = response.json()
            self.ACCESS_TOKEN = token_data['access_token']
            expires_in = token_data.get('expires_in', 'unknown')
            print(f'Token successfully obtained. Expires in {expires_in} seconds.')
        except requests.RequestException as e:
            print(f'Failed to refresh token: {e}')
            raise


def make_request(
    config: Configs, endpoint: str, params: Optional[Dict[str, Any]] = None
) -> Optional[requests.Response]:
    url = f'{config.STUDENT_APP_BASE_URL}{endpoint}'
    headers = {'Authorization': f'Bearer {config.ACCESS_TOKEN}', 'Accept': 'application/json'}
    try:
        response = requests.get(url, params=params, headers=headers)
        logging.debug(f'Request URL: {response.url}')
        logging.debug(f'Response Status Code: {response.status_code}')
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        print(f'HTTP request failed for endpoint {endpoint} with params {params}: {e}')
        return None


def get_open_places(config: Configs) -> list:
    response = make_request(config, '/places/open')
    if response:
        try:
            return response.json()
        except json.JSONDecodeError as e:
            print(f'Failed to decode JSON response for open places: {e}')
    return []


def get_menu(config: Configs, location_id: str, date: str, meal: str) -> Optional[Dict[str, Any]]:
    menu_id = f'{date}-{meal}'
    response = make_request(config, '/dining/menu', params={'locationID': location_id, 'menuID': menu_id})
    if response:
        try:
            return response.json()
        except json.JSONDecodeError as e:
            print(f'Failed to decode JSON response for menu {menu_id} at location {location_id}: {e}')
    return None


def safe_extract_text(
    soup_element: Optional[BeautifulSoup], selector: str, index: Optional[int] = None, sibling: bool = False
) -> str:
    """
    Safely extract and strip text from a BeautifulSoup object.

    :param soup_element: BeautifulSoup object
    :param selector: CSS selector to locate the element
    :param index: Index of the element if multiple elements match
    :param sibling: Whether to extract text from the next sibling
    :return: Extracted text or 'N/A' if not found
    """
    try:
        elements = soup_element.select(selector)
        if not elements:
            return 'N/A'
        if index is not None:
            if index >= len(elements):
                return 'N/A'
            element = elements[index]
        else:
            element = elements[0]
        if sibling:
            sibling_text = element.next_sibling
            if sibling_text:
                return sibling_text.strip()
            else:
                return 'N/A'
        else:
            return element.get_text(strip=True)
    except Exception as e:
        print(f'Error extracting text using selector "{selector}": {e}')
        return 'N/A'


def safe_extract_text(
    soup_element: BeautifulSoup,
    selector: str,
    index: Optional[int] = 0,
    sibling: bool = False,
    label: Optional[str] = None,
    search_text: Optional[str] = None,
) -> str:
    """
    Safely extract and strip text from a BeautifulSoup object.

    :param soup_element: BeautifulSoup object
    :param selector: CSS selector to locate the element
    :param index: Index of the element if multiple elements match
    :param sibling: Whether to extract text from the next sibling
    :param label: Specific label to match within the text
    :param search_text: Text to search within the element to find the desired sibling
    :return: Extracted text or 'N/A' if not found
    """
    try:
        elements = soup_element.select(selector)
        if not elements:
            return 'N/A'
        if label:
            # Find the element that contains the label
            for elem in elements:
                if label.lower() in elem.get_text(strip=True).lower():
                    if sibling:
                        sibling_text = elem.next_sibling
                        if sibling_text:
                            return sibling_text.strip()
                    else:
                        return elem.get_text(strip=True).split(label)[-1].strip()
            return 'N/A'
        elif search_text:
            # Find the element that contains the search_text
            for elem in elements:
                if search_text.lower() in elem.get_text(strip=True).lower():
                    sibling_text = elem.get_text(strip=True).split(search_text)[-1].strip()
                    return sibling_text if sibling_text else 'N/A'
            return 'N/A'
        else:
            element = elements[index]
            if sibling:
                sibling_text = element.next_sibling
                return sibling_text.strip() if sibling_text else 'N/A'
            else:
                return element.get_text(strip=True)
    except Exception as e:
        print(f'Error extracting text using selector "{selector}": {e}')
        return 'N/A'


def safe_extract_vitamin(soup_element: BeautifulSoup, vitamin_name: str) -> str:
    """
    Extract the percentage value for a given vitamin or mineral.

    :param soup_element: BeautifulSoup object
    :param vitamin_name: Name of the vitamin or mineral to extract
    :return: Percentage value as string or 'N/A' if not found
    """
    try:
        # Locate the <li> element that contains the vitamin_name
        li_elements = soup_element.find_all('li')
        for li in li_elements:
            if vitamin_name.lower() in li.get_text().lower():
                span = li.find('span')
                if span:
                    return span.get_text(strip=True)
        return 'N/A'
    except Exception as e:
        print(f'Error extracting vitamin "{vitamin_name}": {e}')
        return 'N/A'


def get_nutrition_info(link: str) -> Optional[Dict[str, Any]]:
    try:
        response = requests.get(link, timeout=10)  # Added timeout for network robustness
        response.raise_for_status()
    except requests.RequestException as e:
        print(f'Failed to fetch nutrition info from {link}: {e}')
        return None

    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        nutrition_info = {
            'serving_size': safe_extract_text(soup, '#facts2'),
            'calories': safe_extract_text(soup, '#facts2 b', index=0),
            'calories_from_fat': safe_extract_text(soup, '#facts2', sibling=True, search_text='Calories from Fat'),
            'total_fat': safe_extract_text(soup, '#facts4 b', sibling=True, index=0),
            'sat_fat': safe_extract_text(soup, '#facts4 b', sibling=True, index=1, label='Sat. Fat'),
            'trans_fat': safe_extract_text(soup, '#facts4 b', sibling=True, index=2, label='Trans Fat'),
            'total_carb': safe_extract_text(soup, '#facts4 b', sibling=True, index=3),
            'dietary_fiber': safe_extract_text(soup, '#facts4 b', sibling=True, index=4, label='Dietary Fiber'),
            'sugars': safe_extract_text(soup, '#facts4 b', sibling=True, index=5, label='Sugars'),
            'cholesterol': safe_extract_text(soup, '#facts4 b', sibling=True, index=6, label='Cholesterol'),
            'sodium': safe_extract_text(soup, '#facts4 b', sibling=True, index=7, label='Sodium'),
            'protein': safe_extract_text(soup, '#facts4 b', sibling=True, index=8),
            'ingredients': safe_extract_text(soup, '.labelingredientsvalue'),
            'allergens': safe_extract_text(soup, '.labelallergensvalue'),
            'vitamin_d': safe_extract_vitamin(soup, 'Vitamin D'),
            'potassium': safe_extract_vitamin(soup, 'Potassium'),
            'calcium': safe_extract_vitamin(soup, 'Calcium'),
            'iron': safe_extract_vitamin(soup, 'Iron'),
        }
        return nutrition_info
    except Exception as e:
        print(f'Error parsing nutrition information from {link}: {e}')
        return None


def main():
    try:
        config = Configs()
    except Exception as e:
        logging.critical(f'Configuration failed: {e}')
        return

    # Get all open places
    print('Fetching open places...')
    places = get_open_places(config)
    print(f'Found {len(places)} dining locations.')

    # Get today's date
    today = datetime.now().strftime('%Y-%m-%d')  # Updated to dynamically get today's date

    # List of meals to check
    meals = ['Breakfast', 'Lunch', 'Dinner']

    # For each place, get the menu for each meal today
    for place in places:
        place_name = place.get('name', 'Unknown')
        place_id = place.get('id', 'Unknown ID')
        place_open = place.get('open', 'Unknown')
        print(f'\n{place_name} (ID: {place_id}, Open: {place_open}):')

        for meal in meals:
            print(f'  Fetching {meal} menu...')
            menu = get_menu(config, place_id, today, meal)
            if menu and 'menus' in menu and menu['menus']:
                print(f'  {meal} Menu:')
                for item in menu['menus']:
                    item_name = item.get('name', 'Unnamed Item')
                    item_description = item.get('description', 'No description')
                    item_link = item.get('link', '')
                    print(f'    - {item_name} ({item_description})')

                    if not item_link:
                        print(f'      No link provided for {item_name}. Skipping nutrition info.')
                        continue

                    nutrition_info = get_nutrition_info(item_link)
                    if nutrition_info:
                        print(f"      Serving Size: {nutrition_info['serving_size']}")
                        print(f"      Calories: {nutrition_info['calories']}")
                        print(f"      Total Fat: {nutrition_info['total_fat']}")
                        print(f"      Total Carb: {nutrition_info['total_carb']}")
                        print(f"      Protein: {nutrition_info['protein']}")
                        print(f"      Ingredients: {nutrition_info['ingredients']}")
                        print(f"      Allergens: {nutrition_info['allergens']}")
                    else:
                        print(f'      Failed to retrieve nutrition info for {item_name}.')
            else:
                print(f'  No {meal.lower()} menu available.')


if __name__ == '__main__':
    main()
