
// src/lib/translations.ts

export interface Translations {
  [key: string]: string;
}

export interface AppTranslations {
  en: Translations;
  ro: Translations;
}

export const translations: AppTranslations = {
  en: {
    // General
    AppName: "WorkSmart Scheduler",
    None: "None",
    Today: "Today",
    Close: "Close",
    View: "View",
    Edit: "Edit",
    Delete: "Delete",
    SaveChangesButton: "Save Changes",
    Error: "Error",
    N_A: "N/A",
    assignments: "assignments", // for chart tooltip
    CancelButton: "Cancel",
    CreateButton: "Create Assignment",
    Processing: "Processing...",
    Loading: "Loading...",
    LoadingDate: "Loading date...",
    UsersTitle: "Users",


    // LoginPage
    LoginTitle: "WorkSmart Scheduler",
    LoginDescription: "Sign in to access your dashboard",
    LoginFooter: "© {year} WorkSmart Scheduler. All rights reserved.",
    EmailLabel: "Email",
    EmailPlaceholder: "name@example.com",
    PasswordLabel: "Password",
    PasswordPlaceholder: "••••••••",
    SignInButton: "Sign In",
    LoginSuccessTitle: "Login Successful",
    LoginSuccessDescription: "Redirecting to your assignments...",
    LoginFailedTitle: "Login Failed",
    LoginFailedDescription: "Invalid email or password. (Hint: admin@example.com, password)",
    ZodEmailInvalid: "Please enter a valid email address.",
    ZodPasswordRequired: "Password is required.",


    // AppLayout Footer
    AppFooter: "WorkSmart Scheduler by Bogdan Turlacu © {year}",

    // Header dropdown & Navigation
    Admin: "Admin",
    Producer: "Producer",
    Operator: "Operator",
    ADMIN: "Admin",
    PRODUCER: "Producer",
    OPERATOR: "Operator",
    Settings: "Settings",
    Logout: "Log out",
    AppHeaderHomeAriaLabel: "WorkSmart Scheduler Home",
    GoToAssignments: "Assignments",
    GoToAdminPanel: "Admin Panel",
    TodaysScheduleButton: "Today's Schedule",
    AssignmentsButtonNav: "Assignments",
    BackToAssignments: "Back to Assignments",


    // Language Toggle
    ToggleLanguage_aria: "Toggle language",
    LanguageChanged_title: "Language Changed",
    LanguageSetTo_description: "Language set to {langName}.",
    LanguageName_en: "English",
    LanguageName_ro: "Romanian",
    PartialTranslation_message: "",

    // Theme Toggle
    ToggleTheme_aria: "Toggle light/dark theme",
    ThemeLight: "Light",
    ThemeDarkTeal: "Dark (Teal)",
    ThemeDarkBluePink: "Dark (Navy/Pink)",
    ThemeSystem: "System",


    // AssignmentsPage
    AssignmentsDashboardTitle: "Assignments Dashboard",
    WorkAssignmentsForDate: "Work Assignments for {date}",
    NewAssignmentButton: "New Assignment",
    NoAssignmentsForDay: "No assignments for this day.",
    ProducersCanAddNewAssignments: "Producers can add new assignments using the button above.",
    CalendarTitle: "Calendar",
    CalendarDescription: "Select a date to view assignments.", // Updated from image
    CalendarSelectedDayLegend: "Selected Day",
    CalendarTasksCompletedLegend: "All Tasks Completed",
    CalendarTasksIncompleteLegend: "Incomplete Tasks",
    TeamScheduleTitle: "Team Schedule",
    TeamScheduleDescription: "{date}",
    ProducersOnDuty: "Producers On Duty",
    OperatorsOnDuty: "Operators On Duty",
    NoneScheduled: "None scheduled.",
    NoProducersOrOperatorsScheduled: "No producers or operators scheduled for this day.",
    AssignmentCreatedSuccessTitle: "Assignment Created",
    AssignmentCreatedSuccessDescription: "Successfully created assignment: {assignmentName}.",
    AssignmentUpdatedSuccessTitle: "Assignment Updated",
    AssignmentUpdatedSuccessDescription: "Successfully updated assignment: {assignmentName}.",
    AssignmentDeletedSuccessTitle: "Assignment Deleted",
    AssignmentDeletedSuccessDescription: "Assignment '{assignmentName}' has been deleted.",
    ConfirmDeleteAssignmentTitle: "Confirm Delete Assignment",
    ConfirmDeleteAssignmentDescription: "Are you sure you want to delete the assignment '{assignmentName}'? This action cannot be undone.",
    DeleteButton: "Delete",
    EditAssignmentModalTitle: "Edit Assignment",
    EditAssignmentModalDescription: "Update the details for the assignment.",
    SearchAssignmentsPlaceholder: "Search by name...",
    NoAssignmentsFoundSearch: "No assignments found matching your search.",
    WorkAssignmentsSearch_title: "Search Results for: \"{searchTerm}\"",
    WorkAssignmentsSearch_description: "Showing all assignments matching your search term.",
    SearchCardTitle: "Search Assignments",


    // AssignmentTable
    AssignmentTableTaskName: "Task Name",
    AssignmentTableDueDate: "Due Date",
    AssignmentTableStatus: "Status",
    AssignmentTablePriority: "Priority",
    AssignmentTableAssignedTo: "Assigned To",
    AssignmentTableActions: "Actions",
    AssignmentTableDone: "Done",
    AssignmentStatusCompleted: "Completed",
    AssignmentStatusPending: "Pending",
    AssignmentStatusInProgress: "In Progress",
    AssignmentTableNoAssignments: "No assignments for this selection.",

    // AssignmentDetailModal
    AssignmentDetailModalTitle: "Details for task ID: {id}",
    AssignmentDetailModalFullDetails: "Full details for the assignment.",
    AssignmentDetailDescriptionLabel: "Description",
    AssignmentDetailPriorityLabel: "Priority",
    AssignmentDetailStatusLabel: "Status",
    AssignmentDetailAssigneeLabel: "Assignee",
    AssignmentDetailDateLabel: "Date",
    AssignmentDetailAddCommentLabel: "Add Comment",
    AssignmentDetailCommentPlaceholder: "Type your comment here...",
    AssignmentDetailPostCommentButton: "Post Comment",
    AssignmentDetailCreatedByLabel: "Created By",
    AssignmentDetailCreatedAtLabel: "Created At",
    AssignmentDetailLastUpdatedByLabel: "Last Updated By",
    AssignmentDetailLastUpdatedAtLabel: "Last Updated At",
    AssignmentDetailCompletedAtLabel: "Completed At",
    PriorityLow: "Low",
    PriorityNormal: "Normal",
    PriorityUrgent: "Urgent",

    // NewAssignmentModal
    NewAssignmentModalTitle: "Create New Assignment",
    NewAssignmentModalDescription: "Fill in the details for the new assignment.",
    AssignmentTitleLabel: "Title",
    AssignmentTitlePlaceholder: "E.g., Prepare quarterly report",
    AssignmentDescriptionLabel: "Description (Optional)",
    AssignmentDescriptionPlaceholder: "Add more details about the task...",
    AssignmentSourceLocationLabel: "Source Location (Optional)",
    AssignmentSourceLocationPlaceholder: "E.g., Shared Drive > Folder X",
    AssignmentPriorityLabel: "Priority",
    AssignmentStatusLabel: "Status",
    AssignmentAssigneeLabel: "Assignee",
    AssignmentAssigneePlaceholder: "Select an operator",
    AssignmentUnassigned: "Unassigned",
    AssignmentDueDateLabel: "Due Date",
    AssignmentPickDate: "Pick a due date",
    ZodAssignmentTitleRequired: "Title is required.",
    ZodAssignmentDueDateRequired: "Due date is required.",
    ZodAssignmentAssignedToRequired: "Please select an assignee.",
    ZodAssignmentPriorityRequired: "Priority is required.",
    ZodAssignmentStatusRequired: "Status is required.",


    // DashboardPage
    DashboardTitle: "Admin Panel",
    UserManagementTab: "User Management",
    TeamSchedulingTab: "Team Scheduling",
    StatisticsTab: "Statistics",
    DataBackupRestoreTab: "Data Backup/Restore",
    ManageTeamScheduleTitle: "Manage Team Schedule",
    ManageTeamScheduleDescription: "Assign producers and operators to specific dates. You can also upload an Excel file (.xls, .xlsx) with schedule data (columns: Date, Role, Email).",
    SelectDateTitle: "Select Date",
    CalendarTodayLegend: "Today",
    AssignRolesForDateTitle: "Assign Roles for {date}",
    ProducersTitle: "Producers",
    OperatorsTitle: "Operators",
    SelectUserAriaLabel: "Select user {userName}",
    SummaryForDateTitle: "Summary for {date}",
    ProducersOnDutySummary: "Producers on duty:",
    OperatorsOnDutySummary: "Operators on duty:",
    SaveScheduleButton: "Save Schedule",
    UploadScheduleFileLabel: "Upload Schedule File (.xls, .xlsx)",
    UploadScheduleButton: "Upload & Process Schedule",
    NoFileSelectedForUpload: "No file selected for upload.",
    FileSelectedMessage: "Selected file: {fileName}",
    ScheduleUploadSuccessTitle: "Schedule Uploaded",
    ScheduleUploadSuccessDescription: "Schedule from {fileName} processed successfully (simulated).",


    // User Management
    UserManagementCreateUserTitle: "Create New User",
    UserManagementUserNameLabel: "User Name",
    UserManagementUserNamePlaceholder: "Enter full name",
    UserManagementUserEmailLabel: "User Email",
    UserManagementUserEmailPlaceholder: "user@example.com",
    UserManagementUserRoleLabel: "User Role",
    UserManagementSelectRolePlaceholder: "Select a role",
    UserManagementCreateUserButton: "Create User",
    UserManagementSaveChangesButton: "Save Changes",
    UserManagementExistingUsersTitle: "Existing Users",
    UserManagementTableUserName: "Name",
    UserManagementTableUserEmail: "Email",
    UserManagementTableUserRole: "Role",
    UserManagementTableActions: "Actions",
    UserManagementEditButton: "Edit",
    UserManagementDeleteButton: "Delete",
    UserManagementNoUsers: "No users found. Create one above!",
    UserCreatedSuccessTitle: "User Created",
    UserCreatedSuccessDescription: "User {userName} created successfully with role {userRole}.",
    UserUpdatedSuccessTitle: "User Updated",
    UserUpdatedSuccessDescription: "User {userName}'s details updated successfully.",
    ZodUserNameRequired: "User name is required.",
    ZodUserEmailRequired: "User email is required.",
    ZodUserRoleRequired: "User role is required.",
    EditUserModalTitle: "Edit User Details",
    EditUserModalDescription: "Update the details for {userName}.",

    // StatisticsPage & StatisticsDashboard (integrated)
    StatisticsPageTitle: "Workflow Statistics",
    StatisticsPageDescription: "Insights into producer and operator activity.",
    QueryStatisticsTitle: "Query Statistics",
    QueryStatisticsDescription: "Select a date range to generate statistics.",
    StartDateLabel: "Start Date",
    EndDateLabel: "End Date",
    PickDatePlaceholder: "Pick a date",
    ThisMonthButton: "This Month",
    LastMonthButton: "Last Month",
    GenerateStatisticsButton: "Generate Statistics",
    GeneratingStatisticsMessage: "Generating statistics, please wait...",
    ErrorGeneratingStatisticsTitle: "Error Generating Statistics",
    StatisticsGeneratedTitle: "Statistics Generated",
    StatisticsGeneratedDescription: "Successfully fetched statistics.",

    OverallSummaryTitle: "Overall Summary",
    TotalAssignmentsCreated: "Total Assignments Created",
    TotalAssignmentsCompleted: "Total Assignments Completed",
    MostActiveProducer: "Most Active Producer",
    MostActiveOperator: "Most Active Operator",

    ProducerActivityTitle: "Producer Activity",
    OperatorActivityTitle: "Operator Activity",
    UserActivityTableDescription: "Summary of {type} activity.",
    UserActivityTableUserID: "User ID",
    UserActivityTableAssignmentsCreated: "Assignments Created",
    UserActivityTableAssignmentsCompleted: "Assignments Completed",
    UserActivityTableAssignmentsCommented: "Assignments Commented",
    UserActivityTableCaption: "{count} {type} listed.",
    UserActivityTableNoData: "No activity data available for the selected period.",

    AssignmentsCompletedDailyChartTitle: "Assignments Completed Daily",
    AssignmentsCompletedDailyChartDescription: "Daily breakdown for {monthName}. (Data source needs implementation or AI flow update for actual values)",
    AssignmentsCompletedDailyChartPlaceholder: "Placeholder data shown. Actual daily completion data needs to be supplied.",
    AssignmentsCompletedDailyChartTooltipCompleted: "Completed",

    StatisticsAssignmentOverviewTitle: "Assignment Overview",
    StatisticsStatusBreakdown: "Status Breakdown:",
    StatisticsPending: "Pending",
    StatisticsInProgress: "In Progress",
    StatisticsUrgent: "Urgent", // Refers to PriorityUrgent for counts here
    StatisticsCompleted: "Completed",
    StatisticsOverallActivity: "Overall Activity:",
    StatisticsFirstAssignment: "First Assignment",
    StatisticsLastAssignment: "Last Assignment",
    StatisticsUniqueDaysWithActivity: "Unique Days with Activity",
    StatisticsAvgAssignmentsPerActiveDay: "Avg. Assignments per Active Day",
    StatisticsBusiestDay: "Busiest Day",
    StatisticsBusiestMonth: "Busiest Month",

    StatisticsDailyCompletionsTitle: "Daily Completions",
    StatisticsDailyCompletionsDescription: "Assignments scheduled and completed each day of {month}. Hover for details.",
    StatisticsMostCompletionsOn: "Most completions on: {date} ({count} assignments)",

    StatisticsUserActivityTitle: "User Activity",
    StatisticsStatsForDate: "Stats for {date}.",
    StatisticsDayViewButton: "Day View",
    StatisticsMonthViewButton: "Month View",
    StatisticsProducersAssignmentsCreated: "Producers - Assignments Created",
    StatisticsProducerName: "Producer Name",
    StatisticsAssignmentsCreated: "Assignments Created",
    StatisticsOperatorsAssignmentsCompleted: "Operators - Assignments Completed",
    StatisticsOperatorName: "Operator Name",

    StatisticsMonthlyCompletionsTrendTitle: "Monthly Completions Trend",
    StatisticsMonthlyCompletionsTrendDescription: "Showing assignments scheduled and completed for the month of {month}.",
    StatisticsChartLegendCompleted: "completed",


    // Data Backup/Restore
    DataBackupRestoreTabTitle: "Data Backup & Restore",
    DataBackupRestoreTabDescription: "Manage your application data backups and restore from a previous point. Actual functionality requires backend implementation.",
    CreateBackupCardTitle: "Create Backup",
    CreateBackupCardDescription: "Generates a new backup of the current application data.",
    CreateBackupButton: "Create New Backup",
    RestoreFromBackupCardTitle: "Restore from Backup",
    RestoreFromBackupCardDescription: "Restore application data from a previously created backup file. This action may overwrite existing data. Ensure you have selected the correct file.",
    SelectBackupFileLabel: "Select Backup File (.json)",
    RestoreButton: "Restore Data",
    BackupHistoryCardTitle: "Backup History",
    BackupHistoryCardDescription: "List of previously created backups.",
    NoBackupsAvailable: "No backups available at the moment.",
    BackupCreatedSuccess: "Backup created successfully (simulated).",
    BackupRestoredSuccess: "Data restored successfully from {fileName} (simulated).",
    BackupFailedError: "Backup operation failed (simulated).",
    RestoreFailedError: "Restore operation failed (simulated).",
    NoFileSelectedError: "No file selected for restore.",
    BackupHistoryTableDate: "Date Created",
    BackupHistoryTableFileName: "File Name",
    BackupHistoryTableSize: "Size",
    BackupHistoryTableActions: "Actions",
    DownloadButton: "Download",
    ConfirmDeleteBackupTitle: "Confirm Delete",
    ConfirmDeleteBackupDescription: "Are you sure you want to delete the backup file {fileName}? This action cannot be undone.",
    NoUsersAvailable: "No users available.",

    // Today's Schedule Page
    TodaysScheduleDashboardTitle: "Today's Schedule Dashboard",
    TodaysSchedulePlaceholder: "Content for Today's Schedule will be displayed here. Admins and Producers can upload a .doc/.docx file.",
    UploadScheduleDocTitle: "Upload Today's Schedule Document",
    UploadScheduleDocDescription: "Upload a .doc or .docx file containing the program schedule for today.",
    SelectDocFileLabel: "Select Document (.doc, .docx)",
    UploadDocButton: "Upload Document",
    NoDocFileSelected: "No document selected.",
    DocFileSelected: "Selected file: {fileName}",
    ProcessingDocUpload: "Processing document upload...",
    DocUploadSuccess: "Document {fileName} uploaded successfully. Content will be processed and displayed.",
    DocUploadFailed: "Document upload failed. Please try again.",
    ScheduleContentTabTitle: "Schedule Content",
    NoScheduleUploadedYet: "No schedule document has been uploaded for today yet.",
    ReturnToAssignmentsDashboardButton: "Return to Assignments Dashboard",

    // Assignment Status Translations
    AssignmentStatusPENDING: "Pending",
    AssignmentStatusIN_PROGRESS: "In Progress", 
    AssignmentStatusCOMPLETED: "Completed",

    // Priority Translations
    PriorityLOW: "Low",
    PriorityNORMAL: "Normal",
    PriorityURGENT: "Urgent",

  },
  ro: {
    // General
    AppName: "WorkSmart Planificator",
    None: "Niciunul",
    Today: "Astăzi",
    Close: "Închide",
    View: "Vezi",
    Edit: "Editează",
    Delete: "Șterge",
    SaveChangesButton: "Salvează Modificările",
    Error: "Eroare",
    N_A: "N/A",
    assignments: "sarcini",
    CancelButton: "Anulează",
    CreateButton: "Creează Sarcină",
    Processing: "Se procesează...",
    Loading: "Se încarcă...",
    LoadingDate: "Se încarcă data...",
    UsersTitle: "Utilizatori",

    // LoginPage
    LoginTitle: "WorkSmart Planificator",
    LoginDescription: "Autentifică-te pentru a accesa panoul de control",
    LoginFooter: "© {year} WorkSmart Planificator. Toate drepturile rezervate.",
    EmailLabel: "Email",
    EmailPlaceholder: "nume@exemplu.com",
    PasswordLabel: "Parolă",
    PasswordPlaceholder: "••••••••",
    SignInButton: "Autentificare",
    LoginSuccessTitle: "Autentificare Reușită",
    LoginSuccessDescription: "Se redirecționează către panoul de sarcini...",
    LoginFailedTitle: "Autentificare Eșuată",
    LoginFailedDescription: "Email sau parolă invalidă. (Sugestie: admin@example.com, password)",
    ZodEmailInvalid: "Te rog introdu o adresă de email validă.",
    ZodPasswordRequired: "Parola este obligatorie.",

    // AppLayout Footer
    AppFooter: "WorkSmart Planificator de Bogdan Turlacu © {year}",

    // Header dropdown & Navigation
    Admin: "Administrator",
    Producer: "Producător", 
    Operator: "Operator",
    ADMIN: "Administrator",
    PRODUCER: "Producător",
    OPERATOR: "Operator",
    Settings: "Setări",
    Logout: "Deconectare",
    AppHeaderHomeAriaLabel: "WorkSmart Planificator Acasă",
    GoToAssignments: "Sarcini",
    GoToAdminPanel: "Panou Admin",
    TodaysScheduleButton: "Programul de Azi",
    AssignmentsButtonNav: "Sarcini",
    BackToAssignments: "Înapoi la Sarcini",

    // Language Toggle
    ToggleLanguage_aria: "Comută limba",
    LanguageChanged_title: "Limbă Schimbată",
    LanguageSetTo_description: "Limba setată la {langName}.",
    LanguageName_en: "Engleză",
    LanguageName_ro: "Română",
    PartialTranslation_message: "",

    // Theme Toggle
    ToggleTheme_aria: "Comută tema lumină/întuneric",
    ThemeLight: "Luminos",
    ThemeDarkTeal: "Întunecat (Turcoaz)",
    ThemeDarkBluePink: "Întunecat (Bleumarin/Roz)",
    ThemeSystem: "Sistem",

    // AssignmentsPage
    AssignmentsDashboardTitle: "Panou Sarcini",
    WorkAssignmentsForDate: "Sarcini de lucru pentru {date}",
    NewAssignmentButton: "Sarcină Nouă",
    NoAssignmentsForDay: "Nicio sarcină pentru această zi.",
    ProducersCanAddNewAssignments: "Producătorii pot adăuga sarcini noi folosind butonul de mai sus.",
    CalendarTitle: "Calendar",
    CalendarDescription: "Selectează o dată pentru a vedea sarcinile.", // Updated from image
    CalendarSelectedDayLegend: "Zi Selectată",
    CalendarTasksCompletedLegend: "Toate Sarcinile Completate",
    CalendarTasksIncompleteLegend: "Sarcini Incomplete",
    TeamScheduleTitle: "Program Echipă",
    TeamScheduleDescription: "{date}",
    ProducersOnDuty: "Producători de Serviciu",
    OperatorsOnDuty: "Operatori de Serviciu",
    NoneScheduled: "Niciunul programat.",
    NoProducersOrOperatorsScheduled: "Niciun producător sau operator programat pentru această zi.",
    AssignmentCreatedSuccessTitle: "Sarcină Creată",
    AssignmentCreatedSuccessDescription: "Sarcina '{assignmentName}' a fost creată cu succes.",
    AssignmentUpdatedSuccessTitle: "Sarcină Actualizată",
    AssignmentUpdatedSuccessDescription: "Sarcina '{assignmentName}' a fost actualizată cu succes.",
    AssignmentDeletedSuccessTitle: "Sarcină Ștearsă",
    AssignmentDeletedSuccessDescription: "Sarcina '{assignmentName}' a fost ștearsă.",
    ConfirmDeleteAssignmentTitle: "Confirmă Ștergerea Sarcinii",
    ConfirmDeleteAssignmentDescription: "Ești sigur că vrei să ștergi sarcina '{assignmentName}'? Această acțiune nu poate fi anulată.",
    DeleteButton: "Șterge",
    EditAssignmentModalTitle: "Editează Sarcina",
    EditAssignmentModalDescription: "Actualizează detaliile pentru sarcină.",
    SearchAssignmentsPlaceholder: "Caută după nume...",
    NoAssignmentsFoundSearch: "Nu s-au găsit sarcini care să corespundă căutării tale.",
    WorkAssignmentsSearch_title: "Rezultate Căutare pentru: \"{searchTerm}\"",
    WorkAssignmentsSearch_description: "Se afișează toate sarcinile care corespund termenului de căutare.",
    SearchCardTitle: "Caută Sarcini",

    // AssignmentTable
    AssignmentTableTaskName: "Nume Sarcină",
    AssignmentTableDueDate: "Data Limită",
    AssignmentTableStatus: "Stare",
    AssignmentTablePriority: "Prioritate",
    AssignmentTableAssignedTo: "Alocat Lui",
    AssignmentTableActions: "Acțiuni",
    AssignmentTableDone: "Gata",
    AssignmentStatusCompleted: "Completată",
    AssignmentStatusPending: "În Așteptare",
    AssignmentStatusInProgress: "În Desfășurare",
    AssignmentTableNoAssignments: "Nicio sarcină pentru această selecție.",

    // AssignmentDetailModal
    AssignmentDetailModalTitle: "Detalii pentru sarcina ID: {id}",
    AssignmentDetailModalFullDetails: "Detalii complete pentru sarcină.",
    AssignmentDetailDescriptionLabel: "Descriere",
    AssignmentDetailPriorityLabel: "Prioritate",
    AssignmentDetailStatusLabel: "Stare",
    AssignmentDetailAssigneeLabel: "Alocat lui",
    AssignmentDetailDateLabel: "Dată",
    AssignmentDetailAddCommentLabel: "Adaugă Comentariu",
    AssignmentDetailCommentPlaceholder: "Scrie comentariul tău aici...",
    AssignmentDetailPostCommentButton: "Postează Comentariu",
    AssignmentDetailCreatedByLabel: "Creat De",
    AssignmentDetailCreatedAtLabel: "Creat La",
    AssignmentDetailLastUpdatedByLabel: "Ultima Actualizare De",
    AssignmentDetailLastUpdatedAtLabel: "Ultima Actualizare La",
    AssignmentDetailCompletedAtLabel: "Completat La",
    PriorityLow: "Scăzută",
    PriorityNormal: "Normală",
    PriorityUrgent: "Urgentă",

    // NewAssignmentModal
    NewAssignmentModalTitle: "Creează Sarcină Nouă",
    NewAssignmentModalDescription: "Completează detaliile pentru noua sarcină.",
    AssignmentTitleLabel: "Titlu",
    AssignmentTitlePlaceholder: "ex: Pregătește raportul trimestrial",
    AssignmentDescriptionLabel: "Descriere (Opțional)",
    AssignmentDescriptionPlaceholder: "Adaugă mai multe detalii despre sarcină...",
    AssignmentSourceLocationLabel: "Locație Sursă (Opțional)",
    AssignmentSourceLocationPlaceholder: "ex: Shared Drive > Folder X",
    AssignmentPriorityLabel: "Prioritate",
    AssignmentStatusLabel: "Stare",
    AssignmentAssigneeLabel: "Alocat lui",
    AssignmentAssigneePlaceholder: "Selectează un operator",
    AssignmentUnassigned: "Nealocat",
    AssignmentDueDateLabel: "Data Limită",
    AssignmentPickDate: "Alege o dată limită",
    ZodAssignmentTitleRequired: "Titlul sarcinii este obligatoriu.",
    ZodAssignmentDueDateRequired: "Data limită este obligatorie.",
    ZodAssignmentAssignedToRequired: "Te rog selectează cui i se alocă sarcina.",
    ZodAssignmentPriorityRequired: "Prioritatea este obligatorie.",
    ZodAssignmentStatusRequired: "Starea este obligatorie.",

    // DashboardPage
    DashboardTitle: "Panou Admin",
    UserManagementTab: "Management Utilizatori",
    TeamSchedulingTab: "Programare Echipă",
    StatisticsTab: "Statistici",
    DataBackupRestoreTab: "Backup/Restaurare Date",
    ManageTeamScheduleTitle: "Gestionează Programul Echipei",
    ManageTeamScheduleDescription: "Alocă producători și operatori la date specifice. Poți încărca și un fișier Excel (.xls, .xlsx) cu datele programului (coloane: Data, Rol, Email).",
    SelectDateTitle: "Selectează Data",
    CalendarTodayLegend: "Astăzi",
    AssignRolesForDateTitle: "Alocă Roluri pentru {date}",
    ProducersTitle: "Producători",
    OperatorsTitle: "Operatori",
    SelectUserAriaLabel: "Selectează utilizatorul {userName}",
    SummaryForDateTitle: "Sumar pentru {date}",
    ProducersOnDutySummary: "Producători de serviciu:",
    OperatorsOnDutySummary: "Operatori de serviciu:",
    SaveScheduleButton: "Salvează Programul",
    UploadScheduleFileLabel: "Încarcă Fișier Program (.xls, .xlsx)",
    UploadScheduleButton: "Încarcă și Procesează Programul",
    NoFileSelectedForUpload: "Niciun fișier selectat pentru încărcare.",
    FileSelectedMessage: "Fișier selectat: {fileName}",
    ScheduleUploadSuccessTitle: "Program Încărcat",
    ScheduleUploadSuccessDescription: "Programul din {fileName} a fost procesat cu succes (simulat).",

    // User Management
    UserManagementCreateUserTitle: "Creează Utilizator Nou",
    UserManagementUserNameLabel: "Nume Utilizator",
    UserManagementUserNamePlaceholder: "Introdu numele complet",
    UserManagementUserEmailLabel: "Email Utilizator",
    UserManagementUserEmailPlaceholder: "utilizator@exemplu.com",
    UserManagementUserRoleLabel: "Rol Utilizator",
    UserManagementSelectRolePlaceholder: "Selectează un rol",
    UserManagementCreateUserButton: "Creează Utilizator",
    UserManagementSaveChangesButton: "Salvează Modificările",
    UserManagementExistingUsersTitle: "Utilizatori Existenți",
    UserManagementTableUserName: "Nume",
    UserManagementTableUserEmail: "Email",
    UserManagementTableUserRole: "Rol",
    UserManagementTableActions: "Acțiuni",
    UserManagementEditButton: "Editează",
    UserManagementDeleteButton: "Șterge",
    UserManagementNoUsers: "Niciun utilizator găsit. Creează unul mai sus!",
    UserCreatedSuccessTitle: "Utilizator Creat",
    UserCreatedSuccessDescription: "Utilizatorul {userName} a fost creat cu succes cu rolul {userRole}.",
    UserUpdatedSuccessTitle: "Utilizator Actualizat",
    UserUpdatedSuccessDescription: "Utilizatorului {userName} i-au fost actualizate detaliile cu succes.",
    ZodUserNameRequired: "Numele utilizatorului este obligatoriu.",
    ZodUserEmailRequired: "Emailul utilizatorului este obligatoriu.",
    ZodUserRoleRequired: "Rolul utilizatorului este obligatoriu.",
    EditUserModalTitle: "Editează Detaliile Utilizatorului",
    EditUserModalDescription: "Actualizează detaliile pentru {userName}.",

    // StatisticsPage & StatisticsDashboard (integrated)
    StatisticsPageTitle: "Statistici Flux de Lucru",
    StatisticsPageDescription: "Informații despre activitatea producătorilor și operatorilor.",
    QueryStatisticsTitle: "Interogare Statistici",
    QueryStatisticsDescription: "Selectează un interval de date pentru a genera statistici.",
    StartDateLabel: "Data de Început",
    EndDateLabel: "Data de Sfârșit",
    PickDatePlaceholder: "Alege o dată",
    ThisMonthButton: "Luna Aceasta",
    LastMonthButton: "Luna Trecută",
    GenerateStatisticsButton: "Generează Statistici",
    GeneratingStatisticsMessage: "Se generează statistici, te rog așteaptă...",
    ErrorGeneratingStatisticsTitle: "Eroare la Generarea Statisticilor",
    StatisticsGeneratedTitle: "Statistici Generate",
    StatisticsGeneratedDescription: "Statisticile au fost preluate cu succes.",

    OverallSummaryTitle: "Sumar General",
    TotalAssignmentsCreated: "Total Sarcini Create",
    TotalAssignmentsCompleted: "Total Sarcini Completate",
    MostActiveProducer: "Cel Mai Activ Producător",
    MostActiveOperator: "Cel Mai Activ Operator",

    ProducerActivityTitle: "Activitate Producători",
    OperatorActivityTitle: "Activitate Operatori",
    UserActivityTableDescription: "Sumar al activității de {type}.",
    UserActivityTableUserID: "ID Utilizator",
    UserActivityTableAssignmentsCreated: "Sarcini Create",
    UserActivityTableAssignmentsCompleted: "Sarcini Completate",
    UserActivityTableAssignmentsCommented: "Sarcini Comentate",
    UserActivityTableCaption: "{count} {type} listați.",
    UserActivityTableNoData: "Nu sunt date de activitate disponibile pentru perioada selectată.",

    AssignmentsCompletedDailyChartTitle: "Sarcini Completate Zilnic",
    AssignmentsCompletedDailyChartDescription: "Detaliere zilnică pentru {monthName}. (Sursa de date necesită implementare sau actualizare AI flow pentru valori reale)",
    AssignmentsCompletedDailyChartPlaceholder: "Date demonstrative afișate. Datele reale de completare zilnică trebuie furnizate.",
    AssignmentsCompletedDailyChartTooltipCompleted: "Completate",

    StatisticsAssignmentOverviewTitle: "Sumar Sarcini",
    StatisticsStatusBreakdown: "Defalcare Stare:",
    StatisticsPending: "În Așteptare",
    StatisticsInProgress: "În Desfășurare",
    StatisticsUrgent: "Urgent",
    StatisticsCompleted: "Completate",
    StatisticsOverallActivity: "Activitate Generală:",
    StatisticsFirstAssignment: "Prima Sarcină",
    StatisticsLastAssignment: "Ultima Sarcină",
    StatisticsUniqueDaysWithActivity: "Zile Unice cu Activitate",
    StatisticsAvgAssignmentsPerActiveDay: "Medie Sarcini pe Zi Activă",
    StatisticsBusiestDay: "Cea Mai Aglomerată Zi",
    StatisticsBusiestMonth: "Cea Mai Aglomerată Lună",

    StatisticsDailyCompletionsTitle: "Completări Zilnice",
    StatisticsDailyCompletionsDescription: "Sarcini programate și completate în fiecare zi din {month}. Treci peste pentru detalii.",
    StatisticsMostCompletionsOn: "Cele mai multe completări pe: {date} ({count} sarcini)",

    StatisticsUserActivityTitle: "Activitate Utilizator",
    StatisticsStatsForDate: "Statistici pentru {date}.",
    StatisticsDayViewButton: "Vizualizare Zi",
    StatisticsMonthViewButton: "Vizualizare Lună",
    StatisticsProducersAssignmentsCreated: "Producători - Sarcini Create",
    StatisticsProducerName: "Nume Producător",
    StatisticsAssignmentsCreated: "Sarcini Create",
    StatisticsOperatorsAssignmentsCompleted: "Operatori - Sarcini Completate",
    StatisticsOperatorName: "Nume Operator",

    StatisticsMonthlyCompletionsTrendTitle: "Trend Completări Lunare",
    StatisticsMonthlyCompletionsTrendDescription: "Afișează sarcinile programate și completate pentru luna {month}.",
    StatisticsChartLegendCompleted: "completate",

    // Data Backup/Restore
    DataBackupRestoreTabTitle: "Backup & Restaurare Date",
    DataBackupRestoreTabDescription: "Gestionează copiile de rezervă ale datelor aplicației și restaurează dintr-un punct anterior. Funcționalitatea reală necesită implementare backend.",
    CreateBackupCardTitle: "Creează Backup",
    CreateBackupCardDescription: "Generează o nouă copie de rezervă a datelor curente ale aplicației.",
    CreateBackupButton: "Creează Backup Nou",
    RestoreFromBackupCardTitle: "Restaurează din Backup",
    RestoreFromBackupCardDescription: "Restaurează datele aplicației dintr-un fișier de backup creat anterior. Această acțiune poate suprascrie datele existente. Asigură-te că ai selectat fișierul corect.",
    SelectBackupFileLabel: "Selectează Fișier Backup (.json)",
    RestoreButton: "Restaurează Datele",
    BackupHistoryCardTitle: "Istoric Backup-uri",
    BackupHistoryCardDescription: "Lista backup-urilor create anterior.",
    NoBackupsAvailable: "Niciun backup disponibil momentan.",
    BackupCreatedSuccess: "Backup creat cu succes (simulat).",
    BackupRestoredSuccess: "Date restaurate cu succes din {fileName} (simulat).",
    BackupFailedError: "Operația de backup a eșuat (simulat).",
    RestoreFailedError: "Operația de restaurare a eșuat (simulat).",
    NoFileSelectedError: "Niciun fișier selectat pentru restaurare.",
    BackupHistoryTableDate: "Data Creării",
    BackupHistoryTableFileName: "Nume Fișier",
    BackupHistoryTableSize: "Mărime",
    BackupHistoryTableActions: "Acțiuni",
    DownloadButton: "Descarcă",
    ConfirmDeleteBackupTitle: "Confirmă Ștergerea",
    ConfirmDeleteBackupDescription: "Ești sigur că vrei să ștergi fișierul de backup {fileName}? Această acțiune nu poate fi anulată.",
    NoUsersAvailable: "Niciun utilizator disponibil.",

    // Today's Schedule Page
    TodaysScheduleDashboardTitle: "Panoul Programului de Azi",
    TodaysSchedulePlaceholder: "Conținutul pentru Programul de Azi va fi afișat aici. Administratorii și Producătorii pot încărca un fișier .doc/.docx.",
    UploadScheduleDocTitle: "Încarcă Documentul Programului de Azi",
    UploadScheduleDocDescription: "Încarcă un fișier .doc sau .docx ce conține programul pentru ziua de azi.",
    SelectDocFileLabel: "Selectează Document (.doc, .docx)",
    UploadDocButton: "Încarcă Document",
    NoDocFileSelected: "Niciun document selectat.",
    DocFileSelected: "Fișier selectat: {fileName}",
    ProcessingDocUpload: "Se procesează încărcarea documentului...",
    DocUploadSuccess: "Documentul {fileName} a fost încărcat cu succes. Conținutul va fi procesat și afișat.",
    DocUploadFailed: "Încărcarea documentului a eșuat. Te rog încearcă din nou.",
    ScheduleContentTabTitle: "Conținut Program",
    NoScheduleUploadedYet: "Niciun document de program nu a fost încărcat pentru azi.",
    ReturnToAssignmentsDashboardButton: "Înapoi la Panoul de Sarcini",

    // Assignment Status Translations
    AssignmentStatusPENDING: "În Așteptare",
    AssignmentStatusIN_PROGRESS: "În Progres", 
    AssignmentStatusCOMPLETED: "Finalizat",

    // Priority Translations
    PriorityLOW: "Scăzută",
    PriorityNORMAL: "Normală",
    PriorityURGENT: "Urgentă",
  }
};

// Helper function to get translation
export const getTranslation = (lang: string | keyof AppTranslations, key: string, params?: Record<string, string>): string => {
  const langKey = lang as keyof AppTranslations;
  // Fallback to English if a key is missing in the current language, then to the key itself.
  let text = translations[langKey]?.[key] || translations.en?.[key] || `Missing translation: ${key}`;

  if (params) {
    Object.keys(params).forEach(paramKey => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
    });
  }
  return text;
};

