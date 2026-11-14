export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string): string | null {
  return password.length < MIN_PASSWORD_LENGTH ? "Password must be at least 8 characters." : null;
}

export function emailAuthError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "invalid_credentials": return "Invalid email or password.";
    case "email_not_confirmed": return "Please confirm your email before signing in.";
    case "user_already_exists": return "An account already exists for this email. Try signing in.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit": return "Too many attempts. Please wait a little and try again.";
    case "weak_password": return "Choose a stronger password of at least 8 characters that hasn’t appeared in a data leak.";
    default: return "We couldn’t complete your request. Please try again.";
  }
}