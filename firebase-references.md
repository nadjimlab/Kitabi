# Firebase implementation references

The implementation follows the Firebase modular Web SDK setup guidance: https://firebase.google.com/docs/web/setup

Phone authentication requires enabling the Phone provider, configuring SMS region policy and authorized domains, and using RecaptchaVerifier with signInWithPhoneNumber: https://firebase.google.com/docs/auth/web/phone-auth

Firestore Security Rules are used for authenticated and role-based access control, and rules are deployed with the Firebase CLI: https://firebase.google.com/docs/firestore/security/get-started

Cloud Storage Rules validate authenticated ownership, content type and file size: https://firebase.google.com/docs/storage/security
