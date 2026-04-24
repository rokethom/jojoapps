def is_role(user, role):
    """
    Aman untuk semua kondisi:
    - user belum login
    - user tidak punya role
    """
    return getattr(user, "is_authenticated", False) and getattr(user, "role", None) == role


def has_role(user, roles: list):
    """
    Untuk multi role
    """
    return getattr(user, "is_authenticated", False) and getattr(user, "role", None) in roles