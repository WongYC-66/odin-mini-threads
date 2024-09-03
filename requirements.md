Requirements
The following requirements are a very global list of features your app should have. Because of the open-ended nature of this project, it’s possible that not all of them may apply to your chosen site, and that there might be core features of your site that aren’t mentioned here.

1. Users must sign in to see anything except the sign-in page.
2. Users should be able to sign in using your chosen authentication method.
3. Users can send follow requests to other users.
4. Users can create posts (begin with text only).
5. Users can like posts.
6. Users can comment on posts.
7. Posts should always display the post content, author, comments, and likes.
8. There should be an index page for posts, which shows all the recent posts from the current user and users they are following.
9. Users can create a profile with a profile picture. Depending on how you handle authentication, for example via passport-github2, you may be able to use their account’s existing profile picture. If this isn’t the case you can use Gravatar to generate them.
10. A user’s profile page should contain their profile information, profile photo, and posts.
11. There should be an index page for users, which shows all users and buttons for sending follow requests to users the user is not already following or have a pending request.
12. Deploy your app to a hosting provider of your choice!

Extra credit
1. Make posts also allow images (either just via a URL or by uploading one). If you did the extra credit from the File Uploader project, then you may recall Cloudinary or Supabase storage being good options for hosting user-uploaded images. The URLs they provide you can then be stored in your database instead of the raw image binary data.
2. Allow users to update their profile photo.
3. Create a guest sign-in functionality that allows visitors to bypass the login screen without creating an account or supplying credentials. This is especially useful if you are planning on putting this project on your résumé - most recruiters, hiring managers, etc. will not take the time to create an account. This feature will allow them to look at your hard work without going through a tedious sign-up process.
4. Make it pretty!