flowchart TD
Start[Start] --> Marketing[Marketing Page]
Marketing --> SignIn[Sign In Page]
SignIn -->|Google Login| AuthCheck{Is Logged In}
AuthCheck -->|Yes| PrivateLayout[Private Layout]
AuthCheck -->|No| SignIn
PrivateLayout --> Dashboard[Dashboard]
PrivateLayout --> Projects[Projects Page]
PrivateLayout --> Profile[User Profile]
PrivateLayout --> Logout[Logout]
Dashboard --> Welcome[Welcome Message]
Projects --> Search[Search Projects]
Projects --> Pagination[Pagination]
Projects --> Sorting[Sorting]
Projects --> AddPanel[Add Project Panel]
Projects --> DeleteAction[Delete Project]
Logout --> Marketing
