from database import tables

import secrets


# Makes completely unique token based on user info
# Token structure:
#   WBM_timestamp.random_data#first_login_in_hex
def make_token(user: tables.User) -> str:
    return f"WBM_{user.register_timestamp}.{secrets.token_hex()}#{user.login.encode('utf-8').hex()}"

# Checks if password secure enough
def is_secure_password(password) -> bool:
    # todo: more checks

    if len(password) < 8:
        return False

    return True

# Gets region based on IP
def get_region() -> str:
    # todo: return actual region
    return "US"



