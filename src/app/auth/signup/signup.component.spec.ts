import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { updateInput } from '../../../testing';
import { AuthError, SignUpErrorCode } from '../auth-error';
import { AuthService } from '../auth.service';
import { SignupComponent } from './signup.component';

const mockAuthService = jasmine.createSpyObj('AuthService', ['createAccount']);

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
      declarations: [SignupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    form = component.signupForm;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable the submit button when the form is invalid', () => {
    const submitButton = fixture.debugElement.query(By.css('.form__button'));
    expect(form.valid).toBeFalse();
    expect(submitButton.properties['disabled']).toBeTrue();
  });

  it('should enable the submit button when the form is valid', () => {
    const emailInput = fixture.debugElement.query(By.css('#email'));
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordInput = fixture.debugElement.query(
      By.css('#confirmPassword')
    );

    updateInput(emailInput, 'test@elvengoods.com');
    updateInput(passwordInput, 'password');
    updateInput(confirmPasswordInput, 'password');

    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('.form__button'));
    expect(form.valid).toBeTrue();
    expect(submitButton.properties['disabled']).toBeFalse();
  });

  it('should only validate the email after the user has changed inputs', () => {
    const emailInput = fixture.debugElement.query(By.css('#email'));
    emailInput.nativeElement.value = 'bad';
    blurValidation(emailInput);
  });

  it('should only require the password after the user has changed inputs', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    passwordInput.nativeElement.value = 'bad';
    blurValidation(passwordInput);
  });

  it('should only validate the confirm password after the user has changed inputs', () => {
    const confirmPasswordInput = fixture.debugElement.query(
      By.css('#confirmPassword')
    );
    confirmPasswordInput.nativeElement.value = 'bad';
    blurValidation(confirmPasswordInput);
  });

  it('should require an email address', () => {
    const emailInput = fixture.debugElement.query(By.css('#email'));
    updateInput(emailInput, '');
    fixture.detectChanges();

    // Validate the form object
    expect(form.valid).toBeFalse();
    expect(component.email?.errors).toEqual({
      required: true,
    });

    // Validate the DOM
    const [error] = getErrors();
    expect(error.properties['innerText']).toBe('An email address is required');
  });

  it('should not allow invalid email addresses', () => {
    const emailInput = fixture.debugElement.query(By.css('#email'));
    updateInput(emailInput, 'invalid email');
    fixture.detectChanges();

    // Validate the form object
    expect(form.valid).toBeFalse();
    expect(component.email?.errors).toEqual({
      email: true,
    });

    // Validate the DOM
    const [error] = getErrors();
    expect(error.properties['innerText']).toBe('Please enter a valid email');
  });

  it('should allow valid email addresses', () => {
    const emailInput = fixture.debugElement.query(By.css('#email'));
    updateInput(emailInput, 'valid@email');
    fixture.detectChanges();

    expect(component.email?.valid).toBeTrue();
    expect(getErrors()).toHaveSize(0);
  });

  it('should require a password', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    updateInput(passwordInput, '');
    fixture.detectChanges();

    // Validate the form object
    expect(form.valid).toBeFalse();
    expect(component.password?.errors).toEqual({
      required: true,
    });

    // Validate the DOM
    const [error] = getErrors();
    expect(error.properties['innerText']).toBe('A password is required');
  });

  it('should not allow a password shorter than 6 characters', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    updateInput(passwordInput, 'abc');
    fixture.detectChanges();

    // Validate the form object
    expect(form.valid).toBeFalse();
    expect(component.password?.errors).toEqual({
      minlength: { requiredLength: 6, actualLength: 3 },
    });

    // Validate the DOM
    const [error] = getErrors();
    expect(error.properties['innerText']).toBe(
      'A password must have at least 6 characters'
    );
  });

  it('should allow valid passwords', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    updateInput(passwordInput, 'password');
    fixture.detectChanges();

    expect(component.password?.valid).toBeTrue();
    expect(getErrors()).toHaveSize(0);
  });

  it('should not allow mismatch passwords', () => {
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordInput = fixture.debugElement.query(
      By.css('#confirmPassword')
    );

    updateInput(passwordInput, 'password');
    updateInput(confirmPasswordInput, 'wrong password');
    fixture.detectChanges();

    // Validate the form object
    expect(form.valid).toBeFalse();
    expect(form?.errors).toEqual({
      passwordMismatch: true,
    });

    // Validate the DOM
    const [error] = getErrors();
    expect(error.properties['innerText']).toBe('Passwords do not match');
  });

  it('should show an error about email already taken', async () => {
    const errorCode: AuthError<SignUpErrorCode> = {
      code: 'auth/email-already-in-use',
      message: '',
    };
    mockAuthService.createAccount.and.rejectWith(errorCode);

    const emailInput = fixture.debugElement.query(By.css('#email'));
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordInput = fixture.debugElement.query(
      By.css('#confirmPassword')
    );

    updateInput(emailInput, 'test@elvengoods.com');
    updateInput(passwordInput, 'password');
    updateInput(confirmPasswordInput, 'password');

    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('.form__button'));
    submitButton.nativeElement.click();

    await fixture.whenStable().then(() => {
      fixture.detectChanges();

      const [error] = getErrors();
      expect(error.properties['innerText']).toContain(
        'An account with this email already exists'
      );
    });
  });

  it('should create a new account with a valid form', async () => {
    mockAuthService.createAccount.and.resolveTo({});

    const emailInput = fixture.debugElement.query(By.css('#email'));
    const passwordInput = fixture.debugElement.query(By.css('#password'));
    const confirmPasswordInput = fixture.debugElement.query(
      By.css('#confirmPassword')
    );

    updateInput(emailInput, 'test@elvengoods.com');
    updateInput(passwordInput, 'password');
    updateInput(confirmPasswordInput, 'password');

    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(By.css('.form__button'));
    submitButton.nativeElement.click();

    await fixture.whenStable().then(() => {
      fixture.detectChanges();

      expect(getErrors()).toHaveSize(0);
      expect(mockAuthService.createAccount).toHaveBeenCalledWith(
        'test@elvengoods.com',
        'password'
      );
    });
  });

  const getErrors = () => {
    return fixture.debugElement.queryAll(By.css('.form__error'));
  };

  const blurValidation = (debugElement: DebugElement) => {
    debugElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(getErrors()).toHaveSize(0);

    debugElement.nativeElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(getErrors()).toHaveSize(1);
  };
});
