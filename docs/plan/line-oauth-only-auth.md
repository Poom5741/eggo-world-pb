# Plan: Switch to LINE OAuth-Only Authentication

## Overview
Modify the authentication flow to remove email/password authentication and use LINE OAuth as the only authentication method.

## Files to Modify

### 1. Login Page (`apps/web/app/auth/login/page.tsx`)
**Changes:**
- Remove email/password form (lines 82-135)
- Remove Turnstile CAPTCHA import and usage
- Remove email/password state management (`email`, `password`, `turnstileToken` states)
- Remove `handleLogin` function
- Update UI to show LINE login as the only option
- Keep auto-redirect if already authenticated
- Update title from "LOGIN" / "ENTER YOUR CREDENTIALS" to "LOGIN WITH LINE"
- Remove the "DON'T HAVE AN ACCOUNT? SIGN UP" divider section
- Keep only LINE login button prominently displayed

### 2. Sign-up Page (`apps/web/app/auth/sign-up/page.tsx`)
**Changes:**
- Remove email/password form (lines 93-158)
- Remove Turnstile CAPTCHA import and usage
- Remove form states (`email`, `password`, `repeatPassword`, `turnstileToken`)
- Remove `handleSignUp` function
- Update UI to show LINE sign-up as the only option
- Keep auto-redirect if already authenticated
- Update title from "CREATE ACCOUNT" / "JOIN EGGOWORLD" to "SIGN UP WITH LINE"
- Remove the "ALREADY HAVE AN ACCOUNT? LOGIN" divider section
- Keep only LINE sign-up button prominently displayed
- Remove redirect to `/auth/sign-up-success` (LINE OAuth handles user creation)

### 3. LINE Login Page (`apps/web/app/auth/line/page.tsx`)
**Changes:**
- Remove the "OR USE EMAIL" link section (lines 132-139)
- Update title from "LINE LOGIN" to "LOGIN"
- Update subtitle from "CONTINUE WITH LINE" to something more generic

### 4. Sign-up Success Page (`apps/web/app/auth/sign-up-success/page.tsx`)
**Changes:**
- This page becomes unused since LINE OAuth doesn't require email verification
- Can be removed entirely, or kept for future use
- If kept, update "BACK TO LOGIN" link text

### 5. Middleware (`apps/web/middleware.ts`)
**No changes needed** - already handles auth redirects properly

## Authentication Flow After Changes

1. User visits `/auth/login` or `/auth/sign-up`
2. Page shows only LINE login button
3. User clicks LINE button → redirected to `/auth/line`
4. User clicks "LOGIN WITH LINE" → redirected to LINE OAuth
5. LINE OAuth callback handles user creation/login
6. User is authenticated and redirected to home page

## Technical Notes

- LINE OAuth already handles both login and sign-up automatically
- Existing users with email/password will need to use LINE OAuth going forward
- Consider: Should we migrate existing users or require them to re-authenticate with LINE?
- The PocketBase backend already supports LINE OAuth via `line-callback.html`

## Verification Steps

1. Test login flow - should only show LINE button
2. Test sign-up flow - should only show LINE button  
3. Verify LINE OAuth callback still works
4. Verify authenticated users are redirected away from auth pages
5. Verify unauthenticated users are redirected to login page
6. Test that existing LINE-authenticated users can still access the app
