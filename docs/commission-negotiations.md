# Seller-information commissions

Initial settings: client pays, 5% starting fee, 0% minimum, reduction of 0.2 percentage points per round. The fee is calculated on one item's listed price, not a quantity total. It is separate from the item price.

## Admin
1. Open **Commission settings**, then **Load settings** to edit the payer, percentages, MoMo number, or disable new negotiations.
2. Open **Item requests** and select **Simeon: seller information** for a request to inspect the offer, negotiation history, payer, payment reference, and status.
3. Verify payment outside the app using the MoMo record. **Confirm payment and unlock** is your attestation that all required payments are complete. A reference alone never unlocks contacts.
4. If payment cannot be verified, enter a review note and select **Return payment for correction**.

## Client and seller
1. Request a posted item from the homepage, item market, or Simeon inventory results.
2. Open **Simeon: seller information**, then **Start negotiation**. Existing requests can also start negotiations from Item requests.
3. The selected payer can enter a lower counteroffer or accept. Simeon reduces the offer by at most the configured step, never below the minimum. For the initial settings: 5%, 4.8%, 4.6%, etc.
4. After accepting, pay the displayed commission and submit the MoMo transaction reference. If the seller pays, the client waits while the seller performs these steps in their Item requests.
5. Refresh the negotiation after admin review. Only the requesting client and admin can retrieve unlocked seller contacts for that request. Public posts remain anonymous.
6. If the offer reaches 0%, accepting sends it for admin approval without requesting a payment reference. Contacts still remain locked until approval.

## Persistence and deployment
- Restart the backend after deploying: its existing startup table creation creates `commission_settings` and `commission_agreements`; existing tables need no new columns.
- New negotiations use current settings. Started negotiations retain their payer, listed price, currency, percentage limits, and payment number, so changes do not alter accepted terms.
- Missing-price items cannot start a negotiation until a price is recorded.
- Negotiation and approval are enforced by backend rules, independently of the AI service. Approval is manual; this does not integrate with a MoMo payment API.
- Fees use decimal arithmetic, rounded up to a whole RWF/UGX or two decimal places for other supported currencies. The displayed amount is the amount to review.

## Admin payment notifications
- Open **Payment notifications** to see submissions awaiting manual review, oldest first. The navigation badge and dashboard reminder show the total pending count.
- Each submission has its own review link, payer, item, commission amount, transaction reference, and submission time. Zero-fee approvals appear here too.
- Opening a notification does not clear it. Approval or return for correction resolves it for all admins; resubmission creates a new notification.
- The queue refreshes every 30 seconds while the dashboard is visible, and on returning to it. Refresh failures preserve the last loaded count and display an error.
- Pending notifications are stored in the database. Restarting the backend creates `payment_review_notifications` and backfills existing pending submissions without duplication.
- These are in-app notifications; they do not send push notifications while the app is closed.

## Client approval notifications
Clients have Refresh approvals on their dashboard and Refresh requests in Requests & marketplace. Approvals refresh every 30 seconds while visible and on returning to the dashboard. They persist after login and link to unlocked contacts for the requesting account, including when the seller paid. These are in-app notifications, not closed-app push messages.
