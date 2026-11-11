# Medi Routes - Cloud Architecture

## 1. Project Overview
Medi Routes is a healthcare platform that helps users
find doctors, explore hospitals, and manage appointments.

## 2. Application Technologies
- Frontend: React.js
- Backend: Node.js and Express.js
- Database: PostgreSQL

## 3. AWS Cloud Architecture
- Amazon CloudFront: Content delivery
- Amazon S3: Frontend static file hosting
- Amazon EC2: Backend API hosting
- Amazon RDS for PostgreSQL: Managed database
- Amazon VPC: Network isolation
- AWS IAM: Access management
- Amazon CloudWatch: Monitoring and logs

## 4. Request Flow
1. User opens the Medi Routes website.
2. CloudFront delivers frontend files from S3.
3. Frontend sends API requests to the backend on EC2.
4. Backend processes requests.
5. Backend communicates with PostgreSQL database.
6. Response returns to the user.

## 5. Scalability and Availability
- CloudFront caches static content.
- EC2 capacity can be increased when required.
- Database backups support recovery.
- Monitoring helps identify application errors.

## 6. Cost Considerations
- Develop and test locally before deploying.
- Use AWS Free Tier where eligible.
- Check service pricing before creating resources.
- Avoid leaving unused cloud resources running.

## 7. Current Implementation Status
- React frontend: Local development
- Express backend: Local development
- PostgreSQL: Configuration pending
- AWS deployment: Not yet performed
-