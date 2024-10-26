"""Simple logger module for the Hoagie Plan app.

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/plan/blob/main/LICENSE.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import logging
import os
import sys

from colorama import Fore, Style, init
from dotenv import load_dotenv

load_dotenv()
init(autoreset=True)

class ColorFormatter(logging.Formatter):
    """A custom log formatter that applies color based on the log level using the Colorama library.
    
    Attributes:
        LOG_COLORS (dict): A dictionary mapping log levels to their corresponding color codes.

    Methods:
        format(record):
            Applies the appropriate color to the log message based on the log level.
            The formatted log message includes details like the log level, timestamp, filename, and line number.

    """

    # Define colors for each log level
    LOG_COLORS = {
        logging.DEBUG: Fore.BLUE + Style.BRIGHT,
        logging.INFO: Fore.WHITE,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED + Style.BRIGHT,
        logging.CRITICAL: Fore.RED + Style.BRIGHT + Style.NORMAL,
    }

    def format(self, record):
        """Format a log record with the appropriate color based on the log level.

        Args:
            record (logging.LogRecord): The log record to format.

        Returns:
            str: The formatted log message with the corresponding color applied.

        """
        # Apply color based on the log level
        color = self.LOG_COLORS.get(record.levelno, Fore.WHITE)
        log_msg = super().format(record)
        return f"{color}{log_msg}{Style.RESET_ALL}"

def setup_logger():
    """Set up a logger with a custom color formatter that logs to standard output (stdout).
    
    The logger is configured with the ColorFormatter to format log messages with color based on the log level.
    The log level is set to INFO by default, but this can be changed to show more or less detailed messages.

    Returns:
        logging.Logger: A logger instance that logs formatted messages to stdout.

    """
    handler = logging.StreamHandler(sys.stdout)

    # Set custom formatter
    handler.setFormatter(ColorFormatter("%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"))
    logger = logging.getLogger(__name__)
    
    # Set to DEBUG to capture all logging levels
    DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")
    logger.setLevel(logging.DEBUG) if DEBUG else logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    return logger

logger = setup_logger() # Initialize once to prevent multiple loggers
