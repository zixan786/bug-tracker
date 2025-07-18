import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { Project, ProjectStatus } from "../models/Project";
import { Bug, BugStatus, BugPriority, BugSeverity, BugType } from "../models/Bug";

async function seed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    // Create repositories
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const bugRepository = AppDataSource.getRepository(Bug);

    // Clear existing data (optional - remove in production)
    await bugRepository.clear();
    await projectRepository.clear();
    await userRepository.clear();

    // Create sample users
    const admin = userRepository.create({
      email: "admin@bugtracker.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
    });

    const developer = userRepository.create({
      email: "developer@bugtracker.com",
      password: "dev123",
      firstName: "John",
      lastName: "Developer",
      role: UserRole.DEVELOPER,
    });

    const tester = userRepository.create({
      email: "tester@bugtracker.com",
      password: "test123",
      firstName: "Jane",
      lastName: "Tester",
      role: UserRole.TESTER,
    });

    const viewer = userRepository.create({
      email: "viewer@bugtracker.com",
      password: "view123",
      firstName: "Bob",
      lastName: "Viewer",
      role: UserRole.VIEWER,
    });

    await userRepository.save([admin, developer, tester, viewer]);
    console.log("Sample users created");

    // Create sample projects
    const project1 = projectRepository.create({
      name: "E-commerce Website",
      description: "Main e-commerce platform for online sales",
      status: ProjectStatus.ACTIVE,
      repository: "https://github.com/company/ecommerce",
      ownerId: developer.id,
      members: [developer, tester],
    });

    const project2 = projectRepository.create({
      name: "Mobile App",
      description: "iOS and Android mobile application",
      status: ProjectStatus.ACTIVE,
      repository: "https://github.com/company/mobile-app",
      ownerId: admin.id,
      members: [admin, developer, tester],
    });

    const project3 = projectRepository.create({
      name: "Internal Dashboard",
      description: "Admin dashboard for internal operations",
      status: ProjectStatus.INACTIVE,
      ownerId: admin.id,
      members: [admin],
    });

    await projectRepository.save([project1, project2, project3]);
    console.log("Sample projects created");

    // Create sample bugs
    const bugs = [
      {
        title: "Login page not responsive on mobile",
        description: "The login form doesn't display properly on mobile devices with screen width less than 768px",
        status: BugStatus.OPEN,
        priority: BugPriority.HIGH,
        severity: BugSeverity.MAJOR,
        type: BugType.BUG,
        projectId: project1.id,
        reporterId: tester.id,
        assigneeId: developer.id,
        stepsToReproduce: "1. Open login page on mobile device\n2. Try to view the form\n3. Notice layout issues",
        expectedBehavior: "Login form should be responsive and display properly",
        actualBehavior: "Form elements are overlapping and not properly aligned",
        environment: "Mobile Safari, Chrome Mobile",
        browserVersion: "Safari 14.0, Chrome 91.0",
        operatingSystem: "iOS 14.6, Android 11",
      },
      {
        title: "Add shopping cart functionality",
        description: "Users need ability to add items to cart and proceed to checkout",
        status: BugStatus.IN_PROGRESS,
        priority: BugPriority.MEDIUM,
        severity: BugSeverity.MINOR,
        type: BugType.FEATURE,
        projectId: project1.id,
        reporterId: admin.id,
        assigneeId: developer.id,
        estimatedHours: 16,
        actualHours: 8,
      },
      {
        title: "App crashes on startup",
        description: "Mobile app crashes immediately after opening on some Android devices",
        status: BugStatus.OPEN,
        priority: BugPriority.CRITICAL,
        severity: BugSeverity.BLOCKER,
        type: BugType.BUG,
        projectId: project2.id,
        reporterId: tester.id,
        stepsToReproduce: "1. Install app on Android device\n2. Open the app\n3. App crashes immediately",
        expectedBehavior: "App should open normally",
        actualBehavior: "App crashes with no error message",
        environment: "Android",
        operatingSystem: "Android 10, Android 11",
      },
      {
        title: "Improve dashboard loading speed",
        description: "Dashboard takes too long to load, affecting user experience",
        status: BugStatus.RESOLVED,
        priority: BugPriority.MEDIUM,
        severity: BugSeverity.MINOR,
        type: BugType.IMPROVEMENT,
        projectId: project3.id,
        reporterId: admin.id,
        assigneeId: developer.id,
        estimatedHours: 8,
        actualHours: 6,
      },
      {
        title: "Update user profile validation",
        description: "Add better validation for user profile updates",
        status: BugStatus.CLOSED,
        priority: BugPriority.LOW,
        severity: BugSeverity.MINOR,
        type: BugType.TASK,
        projectId: project2.id,
        reporterId: developer.id,
        assigneeId: developer.id,
        estimatedHours: 4,
        actualHours: 3,
      },
    ];

    for (const bugData of bugs) {
      const bug = bugRepository.create(bugData);
      await bugRepository.save(bug);
    }

    console.log("Sample bugs created");
    console.log("Database seeding completed successfully!");

    // Display login credentials
    console.log("\n=== Sample Login Credentials ===");
    console.log("Admin: admin@bugtracker.com / admin123");
    console.log("Developer: developer@bugtracker.com / dev123");
    console.log("Tester: tester@bugtracker.com / test123");
    console.log("Viewer: viewer@bugtracker.com / view123");
    console.log("================================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
