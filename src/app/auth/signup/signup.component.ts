import {Component} from '@angular/core';
import {NonNullableFormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthError, SignUpErrorCode} from '../auth-error';
import {AuthService} from '../auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  signupForm = this.fb.group({
    email: ['', Validators.email],
    password: [''],
  });

  signupError = '';

  constructor(
    private authService: AuthService,
    private fb: NonNullableFormBuilder,
    private router: Router,
  ) {}

  get email() {
    return this.signupForm.controls.email;
  }

  get password() {
    return this.signupForm.controls.password;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.authService
        .createAccount(this.email.value, this.password.value)
        .then(_ => this.router.navigate(['/']))
        .catch(({code}: AuthError<SignUpErrorCode>) => {
          switch (code) {
            case 'auth/email-already-in-use':
              this.signupError = 'An account with this email already exists';
              break;
            case 'auth/invalid-email':
              throw new Error(`${code} - should have been covered by Validators.email`);
            case 'auth/operation-not-allowed':
              throw new Error(`${code} - did you enable email/password accounts in Firebase?`);
            case 'auth/weak-password':
              throw new Error(`${code} - should have been covered by the minlength HTML attribute`);
            default:
              const _exhaustiveCheck: never = code;
              throw new Error(`Unhandled case for SignUpErrorCode: ${_exhaustiveCheck}`);
          }
        });
    }
  }
}
