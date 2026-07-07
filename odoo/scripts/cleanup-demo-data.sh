#!/usr/bin/env bash
# One-off: remove test reservations + partners created during verification.
# Safe — uses the ORM (cancels the linked sale order first, then unlinks).
set -e
docker exec -i odoo-odoo-1 odoo shell -d nadi --no-http <<'PY'
Res = env['villa.reservation']
recs = Res.search([('name', 'in', ['NA-2607-0016', 'NA-2607-0017'])])
for r in recs:
    so = r.sale_order_id
    r.unlink()
    if so:
        try:
            so._action_cancel()
            so.unlink()
        except Exception as e:
            print('sale order kept:', e)
print('reservations removed:', len(recs))

P = env['res.partner']
ps = P.search([('email', 'in', ['demo.pay@example.com', 'newguest.demo@example.com'])])
for p in ps:
    try:
        p.unlink()
    except Exception as e:
        print('partner kept (%s):' % p.email, e)
print('partners processed:', len(ps))

env.cr.commit()
print('CLEANUP DONE')
PY
