#!/usr/bin/env bash
# Add the BFF service user (admin) to the General Manager group via the ORM,
# so implied roles (Front Office, Housekeeping, …) cascade correctly.
cd /mnt/c/xampp/htdocs/nadiamerta/odoo
docker compose exec -T odoo odoo shell -d nadi --no-http <<'PY'
gm = env.ref('nadi_amerta.group_nadi_manager')
admin = env.ref('base.user_admin')
admin.write({'groups_id': [(4, gm.id)]})
env.cr.commit()
print("ADMIN_GROUPS_NADI:", [g.name for g in admin.groups_id if 'Nadi' in (g.category_id.name or '')])
PY
