def migrate_account_roles(connection):
    """Update the legacy PostgreSQL role constraint in one transaction."""
    connection.exec_driver_sql('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check')
    connection.exec_driver_sql("""
        ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('technician', 'admin', 'organization', 'institution',
                        'health_facility', 'other_business'))
    """)
