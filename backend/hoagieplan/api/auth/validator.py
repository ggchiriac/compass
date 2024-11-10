"""Verifies the Access Token that the backend passes to the resource.

This class validates JSON Web Tokens (JWTs) issued by an Auth0 domain, 
using the JSON Web Key (JWK) format to handle cryptographic key sets for 
signature verification. 

The validation process follows the JWT Profile for OAuth 2.0 Client 
Authentication and Authorization Grants (RFC 7523), and uses public keys 
fetched from the Auth0 domain's `.well-known` endpoint (RFC 7517).

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/plan/LICENSE.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import json
from urllib.request import urlopen

from authlib.jose.rfc7517.jwk import JsonWebKey
from authlib.oauth2.rfc7523 import JWTBearerTokenValidator


class Auth0JWTBearerTokenValidator(JWTBearerTokenValidator):
    """Validate Auth0 JWT tokens using Authlib's JWTBearerTokenValidator.

    Fetch the public key set from the Auth0 domain and validate tokens
    against the specified audience.
    """

    def __init__(self, domain, audience):
        """Initialize the validator with Auth0's public keys and configure claims.

        Args:
        ----
            domain (str): The Auth0 domain, e.g., 'your-domain.auth0.com'.
            audience (str): The expected audience for the JWT.

        """
        # Construct the issuer URL for the domain
        issuer = f"https://{domain}/"

        # Fetch the public key set from the domain's .well-known endpoint
        json_url = urlopen(f"{issuer}.well-known/jwks.json")

        # Parse and import the public key set from the fetched JSON
        public_key = JsonWebKey.import_key_set(json.loads(json_url.read()))

        # Initialize the parent class with the imported public keys
        super(Auth0JWTBearerTokenValidator, self).__init__(public_key)

        # Define claims validation options: ensure the presence and correctness
        # of the 'exp' (expiration), 'aud' (audience), and 'iss' (issuer) claims
        self.claims_options = {
            "exp": {"essential": True},  # Token must have an expiration
            "aud": {"essential": True, "value": audience},  # Validate audience
            "iss": {"essential": True, "value": issuer},  # Validate issuer
        }
