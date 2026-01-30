import * as Yup from "yup";

export const signupSchema = Yup.object({
  first_name: Yup.string().min(2).max(30).required("Mandatory field."),
  last_name: Yup.string().min(2).max(30).required("Mandatory field."),
  phone_number: Yup.number()
    .min(10)
    .required("Please enter your phone number."),
  email: Yup.string().email().required("Please enter your email id."),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .matches(/[A-Za-z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Please enter your password."),
  confirm_password: Yup.string()
    .required()
    .oneOf([Yup.ref("password"), null], "Password must match."),
  age: Yup.number().min(1).max(150).required("Please enter your age."),
  gender: Yup.string()
    .oneOf(["Male", "Female", "Other"], "Gender must be Male, Female, or Other")
    .required("Please select your gender."),
  city: Yup.string().required("Please enter your city."),
  state: Yup.string().required("Please enter your state."),
});

export const loginSchema = Yup.object({
  email: Yup.string().email().required("Please enter your email id."),
  password: Yup.string().min(8).required("Please enter your password."),
});
