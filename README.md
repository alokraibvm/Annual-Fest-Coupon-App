# Annual Fest Society Coupon Manager

Google Apps Script web app for recording individual ₹20 and ₹50 coupons and showing live, society-wise collection results for Bal Vidya Mandir Sr. Sec. School, Sambhal.

## Project files

- `Code.gs` — configuration, spreadsheet setup, validated coupon writes, and aggregate dashboard calculations.
- `index.html` — mobile-first entry form, dashboard, charts, refresh, and CSV export.

The script should be **bound to the Google Sheet** that stores the records. It uses `SpreadsheetApp.getActiveSpreadsheet()` and does not need a spreadsheet ID. Dashboard requests return aggregated values; individual rows are not sent to the browser.

## Google Sheet structure

The script creates and uses one sheet named `Entries`:

| Timestamp | Society Name | Category | Coupon |
| --- | --- | --- | ---: |
| Date and time | Society label | Junior or Senior | 20 or 50 (number) |

Each saved coupon is one row. Repeated entries are allowed and counted separately.

## Install and set up

1. Create a Google Sheet in the account that will own the app. Give it a recognizable name such as **Annual Fest 2026 Coupons**.
2. In that sheet, open **Extensions → Apps Script**. This creates a bound Apps Script project.
3. Replace the starter contents of `Code.gs` with the contents of the supplied `Code.gs` file. In the Apps Script editor, use **+ → HTML**, name the file `index` (Apps Script displays it as `index.html`), and paste the contents of `index.html`.
4. Save the project. In the function selector in the Apps Script editor, select `setupSpreadsheet` and click **Run**.
5. Review the requested Google permissions and authorize the script with the account that owns the spreadsheet. If Google shows an unverified-app notice for this personal school script, continue only if you recognize the project and its code.
6. Return to the spreadsheet and confirm that `Entries` exists with the four headers in row 1.

## Deploy as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to “Select type” and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone with the link**. This makes the link usable by teachers who are not editors of the script; anyone with the link can submit coupons and see the aggregate dashboard.
5. Click **Deploy** and approve any deployment authorization prompt.
6. Copy the **Web app URL** from the deployment confirmation.
7. Open the URL on a mobile phone. Use the **ENTRY** tab to submit a sample coupon, then **LIVE DASHBOARD** and **REFRESH DASHBOARD** to confirm it appears.
8. Share the web app URL with teachers. They can bookmark it or add it to their phone home screen.

When publishing a code update later, use **Deploy → Manage deployments → Edit** and deploy a new version. Existing deployment URLs normally remain the same when editing that deployment.

## Change the society list

In `Code.gs`, edit the single `SOCIETIES` array near the top. Keep each name unique and spelled exactly as it should appear in entries. Save the project and deploy a new version. Existing sheet records with names removed from the list remain in the sheet but are omitted from calculated totals; therefore, keep previously used names in the list if their totals must continue to count. To rename a society without losing prior totals, first update the corresponding old names in the `Entries` sheet, then update the array.

## How the winner is calculated

For each valid `Entries` row, the server adds the numeric coupon value to that society's Junior or Senior bucket, its ₹20/₹50 bucket, and the overall totals. It sorts societies by overall collection in descending order. The winner, Junior Leader, and Senior Leader use their respective maximum collection; every society tied at that maximum is shown. If the maximum is zero, the dashboard displays “No entries yet.” No winner is stored in the sheet.

## Dashboard and report

The dashboard shows coupon counts and values, Junior/Senior counts and collections, each society's Junior/Senior ₹20/₹50 breakdown, three charts, and the tied leaders. **REFRESH DASHBOARD** retrieves fresh aggregate data without reloading the page. **EXPORT REPORT** downloads the currently displayed society summary as CSV. Chart.js is loaded from jsDelivr over HTTPS; if it is unavailable, the totals and table still work and a chart notice is shown.

## Testing checklist

- [ ] Run `setupSpreadsheet()` twice; there should still be one `Entries` sheet and one header row.
- [ ] Submit a Junior ₹20 entry and a Senior ₹50 entry; confirm numeric `20` and `50` values appear in column D.
- [ ] Submit the same society/category/coupon again; confirm a second row is recorded.
- [ ] Try to submit without each required selection; confirm a friendly message and no row is added.
- [ ] Tap a quick-entry button twice; confirm it saves two entries and retains society/category.
- [ ] Refresh the dashboard; confirm counts, amounts, category breakdowns, ranking, and charts reflect the rows.
- [ ] Make two societies tie in a leader category; confirm both names appear.
- [ ] Export the report and open the downloaded CSV.
- [ ] Open the deployed URL on a phone and verify the controls fit and are easy to tap.

## Notes

- `saveEntry` validates society/category/coupon values on the server and briefly locks concurrent sheet writes.
- The HTML displays totals and society names only; the detailed Entries rows are not returned to the client.
- “Anyone with the link” is convenient for school use, but the URL should be shared with intended teachers. Google Apps Script web app access policies can vary by account and school Workspace administrator settings.
