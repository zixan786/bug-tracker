import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { User } from '../models/mongoose/User';
import { Organization } from '../models/mongoose/Organization';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';
import { Plan } from '../models/mongoose/Plan';
import { Project } from '../models/mongoose/Project';
import { Bug } from '../models/mongoose/Bug';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    await connectMongoDB();
    console.log('🌱 Starting MongoDB seed...');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await OrganizationMember.deleteMany({});
    await Plan.deleteMany({});
    await Project.deleteMany({});
    await Bug.deleteMany({});

    // Create plans
    const starterPlan = await Plan.create({
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small teams',
      priceMonthly: 29,
      priceYearly: 290,
      features: {
        maxUsers: 5,
        maxProjects: 10,
        storage: '10GB'
      },
      limits: {
        maxUsers: 5,
        maxProjects: 10
      }
    });

    const proPlan = await Plan.create({
      name: 'Professional',
      slug: 'pro',
      description: 'For growing teams',
      priceMonthly: 99,
      priceYearly: 990,
      features: {
        maxUsers: 25,
        maxProjects: 50,
        storage: '100GB'
      },
      limits: {
        maxUsers: 25,
        maxProjects: 50
      }
    });

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      email: 'admin@bugtracker.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin'
    });

    // Create demo organizations and users
    const organizations = [
      {
        name: 'Acme Corporation',
        slug: 'acme',
        users: [
          { email: 'admin@acme.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
          { email: 'dev@acme.com', firstName: 'Developer', lastName: 'User', role: 'user' },
          { email: 'sarah@acme.com', firstName: 'Sarah', lastName: 'Johnson', role: 'user' },
          { email: 'mike@acme.com', firstName: 'Mike', lastName: 'Wilson', role: 'user' }
        ],
        projects: [
          { name: 'E-commerce Platform', description: 'Main e-commerce website' },
          { name: 'Mobile Shopping App', description: 'iOS and Android shopping app' },
          { name: 'Payment Gateway', description: 'Secure payment processing system' }
        ]
      },
      {
        name: 'Beta Industries',
        slug: 'beta',
        users: [
          { email: 'admin@beta.com', firstName: 'Beta', lastName: 'Admin', role: 'admin' },
          { email: 'qa@beta.com', firstName: 'QA', lastName: 'Tester', role: 'user' },
          { email: 'tom@beta.com', firstName: 'Tom', lastName: 'Brown', role: 'user' },
          { email: 'lisa@beta.com', firstName: 'Lisa', lastName: 'Davis', role: 'user' }
        ],
        projects: [
          { name: 'CRM System', description: 'Customer relationship management' },
          { name: 'Analytics Dashboard', description: 'Business intelligence dashboard' },
          { name: 'API Gateway', description: 'Microservices API gateway' }
        ]
      },
      {
        name: 'S4 Company',
        slug: 's4',
        users: [
          { email: 'admin@s4.com', firstName: 'S4', lastName: 'Admin', role: 'admin' },
          { email: 'user@s4.com', firstName: 'Regular', lastName: 'User', role: 'user' },
          { email: 'alex@s4.com', firstName: 'Alex', lastName: 'Smith', role: 'user' }
        ],
        projects: [
          { name: 'Internal Tools Suite', description: 'Employee productivity tools' },
          { name: 'Employee Portal', description: 'HR and employee self-service portal' }
        ]
      }
    ];

    for (const orgData of organizations) {
      // Create organization
      const org = await Organization.create({
        name: orgData.name,
        slug: orgData.slug,
        ownerId: superAdmin._id,
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });

      // Create users for this organization
      const orgUsers = [];
      for (const userData of orgData.users) {
        const user = await User.create({
          email: userData.email,
          password: await bcrypt.hash('password123', 10),
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        });
        orgUsers.push(user);

        // Add user as organization member
        await OrganizationMember.create({
          organizationId: org._id,
          userId: user._id,
          role: userData.role === 'admin' ? 'admin' : 'member',
          status: 'active'
        });
      }

      // Create projects for this organization
      const orgProjects = [];
      for (const projectData of orgData.projects) {
        const project = await Project.create({
          name: projectData.name,
          description: projectData.description,
          organizationId: org._id,
          ownerId: orgUsers[0]._id, // First user (admin) is owner
          status: 'active'
        });
        orgProjects.push(project);
      }

      // Create some sample bugs
      const bugTitles = [
        'Login page not responsive on mobile',
        'Database connection timeout',
        'Email notifications not working',
        'Search functionality returns incorrect results',
        'File upload fails for large files'
      ];

      for (let i = 0; i < Math.min(3, bugTitles.length); i++) {
        await Bug.create({
          title: bugTitles[i],
          description: `This is a sample bug description for: ${bugTitles[i]}`,
          organizationId: org._id,
          projectId: orgProjects[i % orgProjects.length]._id,
          reporterId: orgUsers[1]._id, // Second user reports
          assigneeId: orgUsers[0]._id, // First user (admin) assigned
          status: ['open', 'in_progress', 'resolved'][i % 3] as any,
          priority: ['low', 'medium', 'high'][i % 3] as any,
          severity: ['minor', 'major', 'critical'][i % 3] as any,
          type: 'bug',
          estimatedHours: (i + 1) * 4
        });
      }

      console.log(`✅ Created organization: ${orgData.name}`);
    }

    console.log('🎉 MongoDB seed completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Super Admin: admin@bugtracker.com / admin123');
    console.log('Acme Admin: admin@acme.com / password123');
    console.log('Beta Admin: admin@beta.com / password123');
    console.log('S4 Admin: admin@s4.com / password123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await disconnectMongoDB();
  }
}

seed();
