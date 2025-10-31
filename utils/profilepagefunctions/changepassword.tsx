// helpers/auth.ts
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

async function sendmailprocess(
  email: string,
  actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings,
): Promise<void> {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    Alert.alert('Invalid email', 'Please enter a valid email address');
    throw new Error('Invalid email');
  }

  try {
    if (actionCodeSettings) {
      // actionCodeSettings must include a non-empty url property
      await auth().sendPasswordResetEmail(email, actionCodeSettings);
    } else {
      await auth().sendPasswordResetEmail(email);
    }
    Alert.alert(
      'Success',
      'Password reset email sent. Check your inbox and spam folder.',
    );
  } catch (err: any) {
    const code = err?.code;
    if (code === 'auth/invalid-email') {
      Alert.alert('Invalid email', 'The email address is badly formatted');
    } else if (code === 'auth/user-not-found') {
      Alert.alert('User not found', 'No account exists with that email');
    } else if (code === 'auth/network-request-failed') {
      Alert.alert(
        'Network error',
        'Please check your internet connection and try again',
      );
    } else {
      Alert.alert('Error', err?.message ?? 'Failed to send reset email');
    }
    throw err;
  }
}

export async function sendResetEmail(
  email: string,
  actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings,
): Promise<void> {
  await changepassword(email, actionCodeSettings);
}
const changepassword = async (
  email: string,
  actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings,
) => {
  Alert.alert(
    'Change Password',
    'Are you sure you want to change your password? A password reset email will be sent to your registered email address.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          if (!email) {
            Alert.alert('Error', 'No email found for this account');
            return;
          }

          // Optional: confirm the email matches the signed-in user
          const current = auth().currentUser;
          if (current && current.email && current.email !== email) {
            Alert.alert(
              'Warning',
              `Signed-in email (${current.email}) does not match stored email (${email}). Proceed?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Proceed',
                  onPress: () => triggerReset(email || ''),
                },
              ],
            );
            return;
          }

          await triggerReset(email || '');
        },
      },
    ],
  );
};
async function triggerReset(email: string) {
  try {
    await sendmailprocess(email);
    Alert.alert(
      'Success',
      'Password reset email sent successfully. Check your inbox and spam folder.',
    );
  } catch (err: any) {
    console.warn('sendResetEmail error', err);
    const code = err?.code;
    if (code === 'auth/invalid-email') {
      Alert.alert('Invalid email', 'The email address is badly formatted.');
    } else if (code === 'auth/user-not-found') {
      Alert.alert(
        'User not found',
        'No account exists with that email address.',
      );
    } else if (code === 'auth/network-request-failed') {
      Alert.alert(
        'Network error',
        'Please check your connection and try again.',
      );
    } else {
      Alert.alert(
        'Error',
        err?.message ?? 'Failed to send password reset email.',
      );
    }
  } finally {
  }
  return { changepassword };
}
