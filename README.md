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
https://script.google.com/macros/s/AKfycbxAQ5T5FsWtgn7Htr7ohoyA-YY-7gj89ial23ec25gtq0Gte7uvyM82KTDC5c1rOPzNHw/exec
```

After changing `Code.gs`, deploy a new Apps Script version:

```text
Deploy > Manage deployments > Edit > Version: New version > Deploy
```

The static page will work only after the Apps Script backend includes the `action=save` and `action=dashboard` API support.
