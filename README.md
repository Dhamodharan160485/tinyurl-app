# 🔗 Tiny URL - Full Stack Application

A full-stack URL shortener built with **Angular 17** (frontend) 
and **ASP.NET Core 8 Minimal API** (backend), deployed to **Azure**.

##  Live URLs

| Service 				| URL |
|---							|---|
| Frontend 			| https://tinyurl-frontend-dhamo.azurewebsites.net |
| Backend API 	| https://tinyurl-api-dhamo.azurewebsites.net/swagger |
| Azure Function | https://tinyurl-func-dhamo.azurewebsites.net |

---

##  Project Structure
```
tinyurl-app/
├── backend/                    # ASP.NET Core 8 Minimal API
│   └── TinyUrl.Api/
│       ├── Models/             # Data models and DTOs
│       ├── Data/               # EF Core DbContext
│       ├── Services/           # ShortCodeGenerator
│       └── Program.cs          # API routes and middleware
├── frontend/                   # Angular 17 standalone app
│   └── tinyurl-frontend/
│       └── src/
│           ├── app/
│           │   ├── components/ # UrlForm, UrlList components
│           │   ├── models/     # TypeScript interfaces
│           │   └── services/   # TinyUrlService
│           └── environments/   # Dev and prod configs
├── azure-function/             # Azure Function cron job
│   └── TinyUrl.Functions/
│       └── DeleteAllUrlsFunction.cs
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # Azure resources
│   ├── variables.tf            # Input variables
│   └── outputs.tf              # Output values
└── .github/
    └── workflows/
        └── cicd.yml            # GitHub Actions CI/CD
```

---

##  Getting Started

### Prerequisites

| Tool 				| Version | Download |
|---						|------------|---|
| .NET SDK 		| 8.0 		   | https://dotnet.microsoft.com/download |
| Node.js 			| 20+ 		   | https://nodejs.org |
| Angular CLI   | 17+ 	   | `npm install -g @angular/cli` |
| Git 					| Latest    | https://git-scm.com |

---

##  Run Locally

### Step 1: Clone the repository
```bash
git clone https://github.com/Dhamodharan160485/tinyurl-app.git
cd tinyurl-app
```

### Step 2: Run the Backend API
```bash
cd backend/TinyUrl.Api
dotnet restore
dotnet run
```
API runs at: `https://localhost:7001`
Swagger UI: `https://localhost:7001/swagger`

### Step 3: Run the Frontend
Open a new terminal:
```bash
cd frontend/tinyurl-frontend
npm install
ng serve
```
App runs at: `http://localhost:4200`

> **Note:** Update `src/environments/environment.ts` with your API port if different.

---

##  Features

| Feature 
|----------|
| Submit URL to generate short link 
| List public short URLs 
| Mark URL as Private while submitting 
| Show total clicks per URL 
| Search and delete a short URL 
| Copy short URL to clipboard 

---

##  API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/add` | Create a short URL |
| `GET` | `/api/public` | List public URLs |
| `DELETE` | `/api/delete/{code}` | Delete by code |
| `DELETE` | `/api/delete-all` | Delete all URLs |
| `PUT` | `/api/update/{code}` | Update a URL |
| `GET` | `/{code}` | Redirect to original URL |

---

## ️ Design Patterns Used

| Pattern 						| Where Used |
|---									|---|
| Repository Pattern 	| AppDbContext (EF Core) |
| DTO Pattern 				| TinyUrlAddDto, TinyUrlUpdateDto |
| Service Pattern 		| ShortCodeGenerator |
| Dependency Injection | AppDbContext, TinyUrlService |
| Observer Pattern 		| Angular Observables |
| Component Pattern | Angular standalone components |
| Singleton Pattern 	| Angular services (providedIn: root) |

---

##  SOLID Principles

| Principle 						| How Applied |
|---										|---|
| Single Responsibility 	| Each class has one job |
| Open/Closed 					| Environment files for extension |
| Liskov Substitution 		| EF Core provider swappable |
| Interface Segregation 	| DTOs expose only needed fields |
| Dependency Inversion | Services depend on abstractions |

---

##  Azure Infrastructure

| Resource 				| Name 				| Purpose |
|---								|---						|---|
| Resource Group 	| tinyurl-rg 		| Container for all resources |
| App Service Plan 	| tinyurl-plan 	| Server for web apps |
| Backend Web App | tinyurl-api-dhamo | Hosts .NET API |
| Frontend Web App | tinyurl-frontend-dhamo | Hosts Angular app |
| Function App 		| tinyurl-func-dhamo | Hourly cron job |
| Storage Account 	| tinyurlstorage160485 | Function storage + logs |

---

## CI/CD Pipeline

Every push to `main` branch automatically:
1. Builds the .NET backend
2. Deploys backend to Azure
3. Builds Angular frontend
4. Deploys frontend to Azure

---

##  Azure Function (Cron Job)

The `DeleteAllUrls` function runs **every hour** automatically and calls `DELETE /api/delete-all` to clear all URLs.

---

##  Infrastructure as Code (Terraform)
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Provisions all Azure resources automatically.
