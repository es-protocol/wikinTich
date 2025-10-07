// Mock data for AI matching algorithm tests
const mockRequest = {
  id: "test-request-1",
  student_name: "John Doe",
  student_age: 14,
  grade_level: "Secondary",
  subjects: "Mathematics", 
  preferred_schedule: "Afternoons",
  location: "Freetown", 
  additional_requirements: "Need help with algebra"
}

const mockTutors = [
  {
    id: "tutor-1",
    profiles: { full_name: "Alice Math", email: "alice@test.com", phone: "1234567890" },
    subjects: ["Mathematics", "Physics"], 
    location: "Freetown", 
    availability: "Afternoons", 
    rating: 4.8, 
    experience_years: 5,
    is_verified: true,
    education_level: "Bachelor's Degree"
  },
  {
    id: "tutor-2", 
    profiles: { full_name: "Bob English", email: "bob@test.com", phone: "0987654321" },
    subjects: ["English", "Literature"], // English tutor - does not match request above
    location: "Bo", // different city
    availability: "Mornings", // different availability
    rating: 4.2,
    experience_years: 3,
    is_verified: true,
    education_level: "Master's Degree"
  },
  {
    id: "tutor-3",
    profiles: { full_name: "Charlie Math", email: "charlie@test.com", phone: "1122334455" },
    subjects: ["Mathematics", "Chemistry"],
    location: "Freetown", 
    availability: "Afternoons",
    rating: 4.9,
    experience_years: 7,
    is_verified: true,
    education_level: "PhD"
  }
]

module.exports = {
  mockRequest,
  mockTutors
}