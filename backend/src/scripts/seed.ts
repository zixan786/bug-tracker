import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { Organization, SubscriptionStatus } from "../models/Organization";
import { OrganizationMember, OrganizationRole, MemberStatus } from "../models/OrganizationMember";
import { Project, ProjectStatus } from "../models/Project";
import { Bug, BugStatus, BugPriority, BugSeverity, BugType } from "../models/Bug";

async function seed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    // Create repositories
    const userRepository = AppDataSource.getRepository(User);
    const organizationRepository = AppDataSource.getRepository(Organization);
    const memberRepository = AppDataSource.getRepository(OrganizationMember);
    const projectRepository = AppDataSource.getRepository(Project);
    const bugRepository = AppDataSource.getRepository(Bug);

    // Clear existing data (optional - remove in production)
    await bugRepository.clear();
    await projectRepository.clear();
    await memberRepository.clear();
    await organizationRepository.clear();
    await userRepository.clear();

    // Create system admin user
    const systemAdmin = userRepository.create({
      email: "admin@bugtracker.com",
      password: "admin123",
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.ADMIN,
    });
    await userRepository.save(systemAdmin);
    console.log("System admin created");

    // Create organizations
    const acmeOrg = organizationRepository.create({
      name: "Acme Corporation",
      slug: "acme",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const betaOrg = organizationRepository.create({
      name: "Beta Industries",
      slug: "beta",
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    const gammaOrg = organizationRepository.create({
      name: "Gamma Solutions",
      slug: "gamma",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const s4Org = organizationRepository.create({
      name: "S4 Company",
      slug: "s4",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await organizationRepository.save([acmeOrg, betaOrg, gammaOrg, s4Org]);
    console.log("Organizations created");

    // Create tenant users
    const tenantUsers = [
      // Acme Corporation users
      {
        email: "admin@acme.com",
        password: "password123",
        firstName: "Admin",
        lastName: "User",
        role: UserRole.ADMIN,
        organizationId: acmeOrg.id,
        organizationRole: OrganizationRole.ADMIN
      },
      {
        email: "dev@acme.com",
        password: "password123",
        firstName: "Dev",
        lastName: "User",
        role: UserRole.DEVELOPER,
        organizationId: acmeOrg.id,
        organizationRole: OrganizationRole.MEMBER
      },
      // Beta Industries users
      {
        email: "admin@beta.com",
        password: "password123",
        firstName: "Admin",
        lastName: "User",
        role: UserRole.ADMIN,
        organizationId: betaOrg.id,
        organizationRole: OrganizationRole.ADMIN
      },
      {
        email: "qa@beta.com",
        password: "password123",
        firstName: "QA",
        lastName: "User",
        role: UserRole.QA,
        organizationId: betaOrg.id,
        organizationRole: OrganizationRole.MEMBER
      },
      // S4 Company users
      {
        email: "admin@s4.com",
        password: "password123",
        firstName: "Admin",
        lastName: "User",
        role: UserRole.ADMIN,
        organizationId: s4Org.id,
        organizationRole: OrganizationRole.ADMIN
      },
      {
        email: "user@s4.com",
        password: "password123",
        firstName: "User",
        lastName: "User",
        role: UserRole.DEVELOPER,
        organizationId: s4Org.id,
        organizationRole: OrganizationRole.MEMBER
      }
    ];

    // Create users and organization memberships
    for (const userData of tenantUsers) {
      const { organizationId, organizationRole, ...userFields } = userData;

      const user = userRepository.create(userFields);
      await userRepository.save(user);

      const member = memberRepository.create({
        organizationId,
        userId: user.id,
        role: organizationRole,
        status: MemberStatus.ACTIVE
      });
      await memberRepository.save(member);
    }

    console.log("Tenant users and memberships created");

    // Get created users for project ownership
    const acmeAdmin = await userRepository.findOne({ where: { email: "admin@acme.com" } });
    const acmeDev = await userRepository.findOne({ where: { email: "dev@acme.com" } });
    const betaAdmin = await userRepository.findOne({ where: { email: "admin@beta.com" } });
    const betaQA = await userRepository.findOne({ where: { email: "qa@beta.com" } });
    const s4Admin = await userRepository.findOne({ where: { email: "admin@s4.com" } });
    const s4User = await userRepository.findOne({ where: { email: "user@s4.com" } });

    // Create organization-specific projects
    const projects = [
      // Acme Corporation projects
      {
        name: "E-commerce Platform",
        description: "Main e-commerce website for online sales",
        status: ProjectStatus.ACTIVE,
        repository: "https://github.com/acme/ecommerce",
        organizationId: acmeOrg.id,
        ownerId: acmeAdmin!.id,
        members: [acmeAdmin!, acmeDev!],
      },
      {
        name: "Mobile App",
        description: "iOS and Android mobile application",
        status: ProjectStatus.ACTIVE,
        repository: "https://github.com/acme/mobile-app",
        organizationId: acmeOrg.id,
        ownerId: acmeDev!.id,
        members: [acmeAdmin!, acmeDev!],
      },
      // Beta Industries projects
      {
        name: "CRM System",
        description: "Customer relationship management system",
        status: ProjectStatus.ACTIVE,
        repository: "https://github.com/beta/crm",
        organizationId: betaOrg.id,
        ownerId: betaAdmin!.id,
        members: [betaAdmin!, betaQA!],
      },
      {
        name: "Analytics Dashboard",
        description: "Business intelligence and analytics platform",
        status: ProjectStatus.ACTIVE,
        repository: "https://github.com/beta/analytics",
        organizationId: betaOrg.id,
        ownerId: betaQA!.id,
        members: [betaAdmin!, betaQA!],
      },
      // S4 Company projects
      {
        name: "Internal Tools",
        description: "Suite of internal productivity tools",
        status: ProjectStatus.ACTIVE,
        repository: "https://github.com/s4/internal-tools",
        organizationId: s4Org.id,
        ownerId: s4Admin!.id,
        members: [s4Admin!, s4User!],
      }
    ];

    const savedProjects = [];
    for (const projectData of projects) {
      const { members, ...projectFields } = projectData;
      const project = projectRepository.create(projectFields);
      await projectRepository.save(project);

      // Add members (this would typically be done through a separate join table)
      project.members = members;
      await projectRepository.save(project);
      savedProjects.push(project);
    }

    console.log("Organization-specific projects created");

    // Create organization-specific bugs
    const bugs = [
      // Acme Corporation bugs
      {
        title: "Login button not working on mobile",
        description: "Users report that the login button is unresponsive on mobile devices",
        status: BugStatus.OPEN,
        priority: BugPriority.HIGH,
        severity: BugSeverity.MAJOR,
        type: BugType.BUG,
        organizationId: acmeOrg.id,
        projectId: savedProjects[0].id, // E-commerce Platform
        reporterId: acmeAdmin!.id,
        assigneeId: acmeDev!.id,
        stepsToReproduce: "1. Open login page on mobile device\n2. Try to click login button\n3. Button doesn't respond",
        expectedBehavior: "Login button should work on mobile",
        actualBehavior: "Button is unresponsive on mobile devices",
        environment: "Mobile Safari, Chrome Mobile",
      },
      {
        title: "Dashboard loading slowly",
        description: "The dashboard takes more than 5 seconds to load with large datasets",
        status: BugStatus.IN_PROGRESS,
        priority: BugPriority.MEDIUM,
        severity: BugSeverity.MINOR,
        type: BugType.BUG,
        organizationId: acmeOrg.id,
        projectId: savedProjects[1].id, // Mobile App
        reporterId: acmeDev!.id,
        assigneeId: acmeDev!.id,
        estimatedHours: 8,
        actualHours: 4,
      },
      // Beta Industries bugs
      {
        title: "CRM data export failing",
        description: "Large data exports from CRM system are timing out",
        status: BugStatus.OPEN,
        priority: BugPriority.HIGH,
        severity: BugSeverity.MAJOR,
        type: BugType.BUG,
        organizationId: betaOrg.id,
        projectId: savedProjects[2].id, // CRM System
        reporterId: betaQA!.id,
        assigneeId: betaAdmin!.id,
        stepsToReproduce: "1. Go to CRM export page\n2. Select large dataset\n3. Click export\n4. Request times out",
        expectedBehavior: "Export should complete successfully",
        actualBehavior: "Request times out after 30 seconds",
      },
      {
        title: "Add dark mode support",
        description: "Users have requested dark mode for better accessibility",
        status: BugStatus.OPEN,
        priority: BugPriority.LOW,
        severity: BugSeverity.MINOR,
        type: BugType.FEATURE,
        organizationId: betaOrg.id,
        projectId: savedProjects[3].id, // Analytics Dashboard
        reporterId: betaAdmin!.id,
        assigneeId: betaQA!.id,
        estimatedHours: 12,
      },
      // S4 Company bugs
      {
        title: "Internal tool authentication issue",
        description: "Users are getting logged out frequently from internal tools",
        status: BugStatus.RESOLVED,
        priority: BugPriority.MEDIUM,
        severity: BugSeverity.MAJOR,
        type: BugType.BUG,
        organizationId: s4Org.id,
        projectId: savedProjects[4].id, // Internal Tools
        reporterId: s4User!.id,
        assigneeId: s4Admin!.id,
        estimatedHours: 6,
        actualHours: 4,
      }
    ];

    for (const bugData of bugs) {
      const bug = bugRepository.create(bugData);
      await bugRepository.save(bug);
    }

    console.log("Organization-specific bugs created");
    console.log("Multi-tenant database seeding completed successfully!");

    // Display login credentials
    console.log("\n=== Login Credentials ===");
    console.log("System Admin:");
    console.log("  admin@bugtracker.com / admin123");
    console.log("\nTenant Users:");
    console.log("Acme Corporation:");
    console.log("  admin@acme.com / password123 (Admin)");
    console.log("  dev@acme.com / password123 (Developer)");
    console.log("Beta Industries:");
    console.log("  admin@beta.com / password123 (Admin)");
    console.log("  qa@beta.com / password123 (QA)");
    console.log("S4 Company:");
    console.log("  admin@s4.com / password123 (Admin)");
    console.log("  user@s4.com / password123 (Developer)");
    console.log("=========================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
