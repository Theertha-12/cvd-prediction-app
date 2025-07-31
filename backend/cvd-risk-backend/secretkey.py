import secrets
import base64

# Generate 32 bytes of secure random data
random_bytes = secrets.token_bytes(32)

# Encode in base64 URL-safe format (remove trailing '=' padding)
secret_key = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')

print("Your secret key:", secret_key)
