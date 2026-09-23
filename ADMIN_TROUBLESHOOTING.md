# 1 BY 2 STUDIO — ADMINISTRATOR TROUBLESHOOTING & RECOVERY

A comprehensive reference for resolving authentication, permission, and persistence issues in the **1 by 2 Studio** administration suite.

---

## 1. Firestore `permission-denied` Errors

### Root Cause
Direct client-side deletion or modification of collections (such as `portfolio`, `bookings`, `siteSettings`) is restricted by Firestore security rules. Performing mutations directly from client browser code triggers:
`FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`

### Resolution
All sensitive mutations in 1 by 2 Studio are routed through protected Express server routes (`/api/admin/*`). The server validates the administrator's Firebase ID Bearer token against the allowlist:
- `brucetamilyt@gmail.com`
- `nilora23x@gmail.com`

If you encounter this error:
1. Verify that your login email matches one of the authorized addresses.
2. Check that the action uses the corresponding backend API endpoint rather than a direct client-side SDK method.

---

## 2. Google Sign-In Popup & Cross-Origin Issues

### Symptoms
Clicking **Sign In with Google** in an embedded iframe preview fails or displays `auth/popup-blocked` or `auth/cancelled-popup-request`.

### Resolution
1. **Open in New Tab**: Third-party cookies and popup blockers inside sandboxed iframes can prevent Google Identity popups. Open the site in a dedicated browser tab using the top-right preview button.
2. **Authorized Redirect URIs**: Ensure the application domain is listed under Firebase Authentication &rarr; Settings &rarr; Authorized Domains in the Firebase Console.
3. **Diagnostic Panel**: On the `/admin` login page, click the **System Diagnostics** drawer to view real-time environment readiness, current auth user status, and network reachability.

---

## 3. Design & Styles Persistence Issues

### Expected Behavior
When modifying colors, typography, or borders under **Styles & Design**:
1. Changes apply instantaneously to CSS variables (`--color-primary`, `--color-accent`, `--color-bg`, etc.).
2. The state is synchronized to `localStorage` (`studio_design_settings`) and Firestore (`designSettings/theme`).
3. Upon hard page reload, settings remain preserved.

### Troubleshooting
- If changes revert on reload: Check browser storage permissions. Verify that `localStorage` is not disabled or in strict incognito mode.
- To revert to the factory gold-atelier theme: Click **Reset to Studio Defaults** in the top-right corner of the **Styles & Design** panel.

---

## 4. Booking Alert Notifications (Email & WhatsApp)

- **Email Notifications**: Powered by Resend. Verify `RESEND_API_KEY` in environment variables if confirmation emails remain in `pending` status.
- **WhatsApp Direct**: Studio managers can click **Open WhatsApp** from any booking detail view to launch a pre-composed template message directly to the client's phone number without requiring external API setup.
