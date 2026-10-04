# Infotris
Infotris
# Founder 
Devlop, build and founded by Suryansh 
 # About Suryansh
 I’m Suryansh, a student, developer, and builder passionate about technology, learning, and creating things that solve real problems. I built Infotris from the ground up with a simple idea: learning technology should feel structured, practical, and enjoyable—not like endless tutorials. I’m constantly exploring software, AI, philosophy, writing, and new ideas, while turning what I learn into things that others can use. Infotris is one of those ideas, and I’m building it step by step.

Instagram - https://www.instagram.com/suryansh1_0 

Linkedin - https://www.linkedin.com/in/suryansh-cse10/

## Profile image uploads

Profile photos and banners are uploaded to Firebase Storage under
`profileImages/{userId}/avatar` and `profileImages/{userId}/banner`. Their
download URLs are saved with the profile in `users/{userId}` in Firestore.
The Storage rules in `storage.rules` restrict uploads and reads to the signed-in
owner and allow JPEG, PNG, WebP, or GIF images up to 5 MB.

After enabling Firebase Storage for the `infotris` project, deploy the rules with:

```sh
firebase deploy --only storage --project infotris
```