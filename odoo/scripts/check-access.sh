#!/usr/bin/env bash
cd /mnt/c/xampp/htdocs/nadiamerta/odoo
q() { docker compose exec -T db psql -U odoo -d nadi -tA -c "$1"; }
gm=$(q "SELECT res_id FROM ir_model_data WHERE module='nadi_amerta' AND name='group_nadi_manager';")
fo=$(q "SELECT res_id FROM ir_model_data WHERE module='nadi_amerta' AND name='group_nadi_front_office';")
echo "GM group id=$gm  FrontOffice id=$fo"
echo "admin(uid2) in GM:          $(q "SELECT count(*) FROM res_groups_users_rel WHERE uid=2 AND gid=$gm;")"
echo "admin(uid2) in FrontOffice: $(q "SELECT count(*) FROM res_groups_users_rel WHERE uid=2 AND gid=$fo;")"
