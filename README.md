# Annual Fest Coupon GitHub Page

This folder is a static GitHub Pages version of the Annual Fest Coupon Manager.

## Files

- `index.html` - page layout and form.
- `styles.css` - responsive styling.
- `app.js` - form saving, dashboard loading, charts, and CSV export.

## Deploy on GitHub Pages

1. Commit and push the `coupon` folder to the `School-Fest` GitHub repository.
2. In GitHub, open the repository settings.
3. Go to `Pages`.
4. Select the branch that contains these files, usually `main`.
5. Save the Pages setting.
6. Open:

```text
https://alokraibvm.github.io/School-Fest/coupon/
```

## Apps Script backend

The GitHub page sends data to this web app URL, set in `app.js`:

```text
https://script.google.com/macros/s/AKfycbwhkkTho7BS6lHdyP3Dt2HV5HTYIRabEYMTQ42e2RKb2yBHqAoR9BHYhRnrdwle1We2og/exec
```

The Apps Script backend writes coupon entries to this Google Sheet:

```text
https://docs.google.com/spreadsheets/d/1aqiygg7_onto_l9CjjiohcHPpO4wjzZODaaE3IdZX8I/edit
```

After changing `Code.gs`, deploy a new Apps Script version:

```text
Deploy > Manage deployments > Edit > Version: New version > Deploy
```

The Apps Script handler must be deployed with `action=save` and `action=couponDashboard` support. Both actions use the `Entries` sheet in the workbook above, so the dashboard totals reflect saved coupon submissions.

## Static QR for one live cell

Use this URL in a QR code when you want the QR to stay the same, but the displayed value to update from `Entries!D2`:

```text
https://alokraibvm.github.io/School-Fest/coupon/live.html
```

When scanned, the page calls the Apps Script backend with `action=livevalue` and displays the current value from `Entries!D2`.
