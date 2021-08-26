import { Component, OnInit } from '@angular/core';
import { Customer } from './customer';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { debounceTime} from 'rxjs/Operators';

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null{
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl.pristine || confirmControl.pristine){
    return null;
  }

  if(emailControl.value === confirmControl.value) {
    return null;
  }
  return {'match': true}
}

function ratingRange(min: number, max: number) : ValidatorFn{
  return(c: AbstractControl): { [key: string]: Boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return {'range': true};
    }
    return null;
  }
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();
  emailMessage: string;

  get addresses(): FormArray{
    return <FormArray>this.customerForm.get('addresses');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['',[Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['',[Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['',[Validators.required, Validators.email]],
        confirmEmail: ['', Validators.required]
      }, {validator: emailMatcher}),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1,5)],
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddresses()])
    });

    this.customerForm.get('notification').valueChanges.subscribe( //this watches for changes to notification options w/o the need for a watcher on html side
      value => this.setNotification(value)
    );

    const emailControl = this.customerForm.get('emailGroup.email'); // is this needed for every form object? is there a way to do this will all form controls
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );

   
    // this.customerForm.valueChanges.pipe(
    //   debounceTime(1000)
    // ).subscribe(
    //   value => this.setMessage()
    // );
  }

  addAddress(): void{
    this.addresses.push(this.buildAddresses());
  }

  buildAddresses(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    })
  }

  populateTestData():void{
  this.customerForm.patchValue({
    firstName: 'Jack',
    lastName: 'Harkness',
    sendCatalog: false
    })
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl): void { // how can I do this for all form controls w/o writing a function for each
    this.emailMessage = "";
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === "text"){
      phoneControl.setValidators(Validators.required);
    }else{
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }
}


