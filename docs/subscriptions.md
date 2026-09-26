# Yearly subscriptions

Free: 0 RWF; Standard: 20 RWF; Premium: 100 RWF per year.
Every plan has all current services. Admin can explicitly upgrade an account to a higher paid plan and require payment confirmation before further authenticated access. No automatic charging, renewal, expiration
enforcement, or paid-feature restrictions are enabled in this version.

Admin > Subscriptions controls the default monthly/yearly billing period, Standard/Premium prices, currency availability,
conversion rates, rate notes, MoMo number, and manual payment status. Free stays
zero. Payments are made outside the app to 0786854200 by default; this is not a
MoMo payment-gateway integration. Confirm a transaction before marking it paid.

Rates are stored as RWF per one foreign currency unit. Converted display prices
use four decimal places because the RWF amounts are small. The actual MoMo
amount is the RWF price. These are administrator-maintained display estimates,
not live settlement quotes. Initial reference snapshot from
https://bankfxapi.com/bank/27 (retrieved 2026-09-26): USD 1478.35, dated
2026-09-23; EUR 1681.22505, KES 11.422571, TZS 0.55893, UGX 0.376316,
dated 2026-09-25. Update rates and their source/date note in admin as needed.

Signup saves the selected plan, currency, converted quote and RWF amount
atomically with the account. Changed catalogue versions require users to reload
and review prices. Later price edits do not change existing selections.
Paid selections start pending, never automatically paid. Older apps and existing
accounts without a selection remain free and retain their services.

Restarting the backend creates subscription_settings and account_subscriptions.

## Admin upgrades

Accounts > Upgrade subscription allows only upward changes (Free to Standard or
Premium, Standard to Premium). Admin chooses monthly/yearly, reviews the exact
RWF price, and confirms the lockout. The API rejects changes to admin accounts,
same-plan changes, and downgrades. Upgrades reset payment status to pending.
Existing tokens and new logins are blocked until admin marks payment paid under
Subscriptions. Waivers cannot unlock an account explicitly upgraded this way.
A later upgrade requires fresh confirmation even if the previous plan was paid.

Changing the default billing period affects new selections only. Upgrade forms
can select a period for that account; the displayed price applies to that chosen
period without automatic prorating. There is no automatic recurring charge or
expiry lockout. Devices that are offline cannot learn a new admin restriction
until they reconnect; server requests remain blocked. The app shows a payment
screen when it receives that restriction.
