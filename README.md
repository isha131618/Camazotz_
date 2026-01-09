# Camazotz - MedTech
## MediCare - Medical Management System

A comprehensive medical management system built with Node.js, Express, React, and MongoDB. This application provides complete functionality for managing patients, doctors, appointments, queries, and medical records.

## Features

### Core Functionality
- **Patient Management**: Register, view, edit, and delete patient records
- **Doctor Management**: Manage doctor profiles, specializations, and availability
- **Appointment Scheduling**: Book, manage, and track appointments
- **Query Management**: Handle patient inquiries and responses
- **Medical Records**: Comprehensive patient medical history and records
- **Authentication**: Secure login system with role-based access

### Key Features
- Responsive web design with Tailwind CSS
- Real-time dashboard with statistics
- Search and filter functionality
- Form validation and error handling
- RESTful API architecture
- MongoDB database integration
- Modern React components with hooks

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medical-site
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Configuration**
   - Copy `.env` file and update with your configuration
   - Update MongoDB connection string
   - Set JWT secret key
   - Configure email settings if needed

5. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/medical-site`

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   npm run client
   ```
   Frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Register new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/search/:query` - Search patients

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Add new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Queries
- `GET /api/queries` - Get all queries
- `GET /api/queries/:id` - Get query by ID
- `POST /api/queries` - Submit new query
- `PUT /api/queries/:id/respond` - Respond to query
- `PATCH /api/queries/:id/status` - Update query status

### Medical Records
- `GET /api/medical-records` - Get all medical records
- `GET /api/medical-records/:id` - Get record by ID
- `POST /api/medical-records` - Create medical record
- `PUT /api/medical-records/:id` - Update medical record

## Database Schema

### Patient Model
- Personal information (name, email, phone, DOB, gender)
- Address details
- Medical information (blood group, allergies, conditions)
- Emergency contact
- Insurance information

### Doctor Model
- Professional information (name, specialization, department)
- License and experience
- Availability schedule
- Consultation fees

### Appointment Model
- Patient and doctor references
- Date, time, and duration
- Type and status
- Reason and notes
- Prescription details

### Query Model
- Patient reference
- Subject and description
- Category and priority
- Status tracking
- Response management

### Medical Record Model
- Comprehensive patient medical history
- Examination findings
- Diagnosis and treatment plans
- Lab tests and imaging
- Medications and follow-ups

## Features in Detail

### Dashboard
- Real-time statistics
- Recent activity feed
- Quick action buttons
- Visual charts and graphs

### Patient Registration
- Multi-step form with validation
- Medical history collection
- Emergency contact setup
- Insurance information

### Query Management
- Priority-based categorization
- Status tracking
- Response system
- Search and filter capabilities

### Appointment System
- Calendar view
- Doctor availability
- Patient scheduling
- Status management

## Security Features
- JWT-based authentication
- Password hashing
- Input validation
- CORS protection
- Error handling

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For support and questions, please open an issue in the repository.

## Future Enhancements
- Video consultation integration
- Mobile app development
- Advanced reporting and analytics
- Integration with medical devices
- Prescription management system
- Billing and insurance processing

## Screenshots
<img width="1600" height="781" alt="image" src="https://github.com/user-attachments/assets/9ef89347-f1c4-4f9b-a963-d7af95f7c978" />
