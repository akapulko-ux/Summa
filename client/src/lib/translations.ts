// Файл с переводами для всего приложения

export type Translation = {
  // Общие компоненты
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    back: string;
    submit: string;
    next: string;
    prev: string;
    add: string;
    remove: string;
    welcome: string;
    logout: string;
    theme: string;
    language: string;
    profile: string;
    settings: string;
    notification: string;
    appName: string;
    optional: string;
    date: string;
    restore: string;
    information: string;
    refresh: string;
  };
  
  // Резервное копирование
  backups: {
    title: string;
    manageBackups: string;
    createBackup: string;
    restoreBackup: string;
    deleteBackup: string;
    backupName: string;
    backupSize: string;
    backupDate: string;
    manualBackup: string;
    scheduledBackup: string;
    setupSchedule: string;
    confirmRestore: string;
    confirmDelete: string;
    noBackups: string;
    backupCreated: string;
    backupRestored: string;
    backupDeleted: string;
    cleanOldBackups: string;
    keepCount: string;
    scheduleInterval: string;
  };

  // Аутентификация
  auth: {
    login: string;
    register: string;
    forgotPassword: string;
    magicLink: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    company: string;
    phone: string;
    loginAction: string;
    registerAction: string;
    logoutAction: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    emailSent: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    namePlaceholder: string;
    companyPlaceholder: string;
    phonePlaceholder: string;
    sendMagicLink: string;
    magicLinkSent: string;
    createAccount: string;
    creatingAccount: string;
    signingIn: string;
    sendingLink: string;
    enterCredentials: string;
    fillDetails: string;
    enterEmail: string;
    rememberPassword: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };

  // Навигация
  nav: {
    dashboard: string;
    users: string;
    services: string;
    subscriptions: string;
    analytics: string;
    profile: string;
    settings: string;
    help: string;
  };

  // Дашборд
  dashboard: {
    title: string;
    quickAction: string;
    newSubscription: string;
    newService: string;
    manageSubscriptions: string;
    viewSubscriptions: string;
    browseServices: string;
    viewServices: string;
    userManagement: string;
    manageUsers: string;
    accountSettings: string;
    viewProfile: string;
    stats: string;
    total: string;
    active: string;
    inactive: string;
    subscriptionStats: string;
    userStats: string;
    recentActivity: string;
    popularServices: string;
    recentSubscriptions: string;
    activeServices: string;
  };

  // Сервисы
  services: {
    title: string;
    manageServices: string;
    browseServices: string;
    addService: string;
    editService: string;
    serviceTitle: string;
    serviceDescription: string;
    serviceIcon: string;
    cashback: string;
    customFields: string;
    customFieldsDesc: string;
    editCustomFields: string;
    editCustomFieldsDesc: string;
    fieldName: string;
    fieldNamePlaceholder: string;
    fieldType: string;
    fieldTypeText: string;
    fieldTypeNumber: string;
    fieldTypeBoolean: string;
    fieldTypeDate: string;
    fieldTypeSelect: string;
    selectFieldType: string;
    defaultValue: string;
    defaultValuePlaceholder: string;
    selectOptionsHint: string;
    visibleToUsers: string;
    visibleToUsersDesc: string;
    addCustomField: string;
    addCustomFieldsPrompt: string;
    fieldNumber: string;
    noCustomFields: string;
    noCustomFieldsAdmin: string;
    adminOnly: string;
    customFieldsUpdated: string;
    customFieldsUpdatedDesc: string;
    customFieldsDeleted: string;
    customFieldsDeletedDesc: string;
    confirmDeleteAllFields: string;
    confirmDeleteAllFieldsDesc: string;
    createService: string;
    updateService: string;
    confirmDelete: string;
    noServices: string;
    serviceDetails: string;
    serviceCreated: string;
    serviceUpdated: string;
    serviceDeleted: string;
    servicesByCount: string;
    availableServices: string;
    availableToSubscribe: string;
  };

  // Подписки
  subscriptions: {
    title: string;
    manageSubscriptions: string;
    addSubscription: string;
    editSubscription: string;
    subscriptionTitle: string;
    service: string;
    domain: string;
    loginId: string;
    paymentPeriod: string;
    monthly: string;
    quarterly: string;
    yearly: string;
    paymentAmount: string;
    paidUntil: string;
    licensesCount: string;
    usersCount: string;
    status: string;
    statusActive: string;
    statusPending: string;
    statusExpired: string;
    statusCanceled: string;
    createSubscription: string;
    updateSubscription: string;
    confirmDelete: string;
    noSubscriptions: string;
    subscriptionDetails: string;
    subscriptionCreated: string;
    subscriptionUpdated: string;
    subscriptionDeleted: string;
    mySubscriptions: string;
    active: string;
    activeUntil: string;
    nextPayment: string;
  };

  // Пользователи
  users: {
    title: string;
    manageUsers: string;
    addUser: string;
    editUser: string;
    userEmail: string;
    userName: string;
    userCompany: string;
    userPhone: string;
    userRole: string;
    roleAdmin: string;
    roleClient: string;
    status: string;
    statusActive: string;
    statusInactive: string;
    createUser: string;
    updateUser: string;
    confirmDelete: string;
    noUsers: string;
    userDetails: string;
    userCreated: string;
    userUpdated: string;
    userDeleted: string;
  };

  // Профиль
  profile: {
    title: string;
    personalInfo: string;
    accountSettings: string;
    updateProfile: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    profileUpdated: string;
    passwordUpdated: string;
    role: string;
    accountStatus: string;
    active: string;
    memberSince: string;
  };
  
  // Массовые рассылки
  broadcast: {
    title: "Broadcast Messages",
    sendBroadcast: "Send Broadcast",
    connectedUsers: "Connected Users",
    newBroadcast: "New Broadcast Message",
    newBroadcastDesc: "Create a new message to send to all connected users",
    recipientFilter: "Recipient Filter",
    selectRecipients: "Select recipients",
    allUsers: "All Users",
    adminUsers: "Admin Users Only",
    clientUsers: "Client Users Only",
    recipientFilterDesc: "Choose which group of users will receive this message",
    messageContent: "Message Content",
    messageContentPlaceholder: "Enter your message here...",
    messageContentDesc: "This message will be sent to all selected users with connected Telegram accounts",
    sendNow: "Send Now",
    broadcastSent: "Broadcast sent",
    broadcastSentDesc: "Your message was sent to {success} users (failed: {failed})",
    broadcastFailed: "Broadcast failed",
    lastBroadcastResult: "Last broadcast result",
    deliveredCount: "Delivered",
    failedCount: "Failed",
    tips: "Broadcast Tips",
    tip1: "Keep your messages concise and clear for better user experience",
    tip2: "Use broadcast messages sparingly to avoid overwhelming users",
    tip3: "Consider sending broadcasts during business hours when users are likely to see them",
    tip4: "Include a clear call-to-action if you want users to take specific steps",
    connectedUsersDesc: "Users with linked Telegram accounts",
    totalConnected: "Total connected users",
    userId: "User ID",
    telegramChatId: "Telegram Chat ID",
    linkedOn: "Linked on",
    messageThis: "Message",
    testMessageToUser: "This is a test message for user {userId} from the admin panel.",
    noConnectedUsers: "No connected users",
    noConnectedUsersDesc: "There are currently no users with linked Telegram accounts."
  },

  // Telegram
  telegram: {
    title: string;
    description: string;
    connect: string;
    connected: string;
    notConnected: string;
    generateLink: string;
    linkInstructions: string;
    openBot: string;
    sendCommand: string;
    afterLink: string;
    receiveNotifications: string;
    sendTestNotification: string;
    testNotificationSent: string;
    disconnect: string;
    disconnected: string;
    confirmDisconnect: string;
    disconnectWarning: string;
  };

  // Ошибки и сообщения
  messages: {
    invalidCredentials: string;
    requiredField: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordsDoNotMatch: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    welcomeBack: string;
    goodbye: string;
    invalidToken: string;
    expiredToken: string;
    userNotFound: string;
    loginFailed: string;
    emailAlreadyExists: string;
    invalidLink: string;
    linkExpired: string;
    somethingWentWrong: string;
  };
};

export const en: Translation = {
  broadcast: {
    title: "Broadcast Messages",
    sendBroadcast: "Send Broadcast",
    connectedUsers: "Connected Users",
    newBroadcast: "New Broadcast Message",
    newBroadcastDesc: "Create a new message to send to all connected users",
    recipientFilter: "Recipient Filter",
    selectRecipients: "Select recipients",
    allUsers: "All Users",
    adminUsers: "Admin Users Only",
    clientUsers: "Client Users Only",
    recipientFilterDesc: "Choose which group of users will receive this message",
    messageContent: "Message Content",
    messageContentPlaceholder: "Enter your message here...",
    messageContentDesc: "This message will be sent to all selected users with connected Telegram accounts",
    sendNow: "Send Now",
    broadcastSent: "Broadcast sent",
    broadcastSentDesc: "Your message was sent to {success} users (failed: {failed})",
    broadcastFailed: "Broadcast failed",
    lastBroadcastResult: "Last broadcast result",
    deliveredCount: "Delivered",
    failedCount: "Failed",
    tips: "Broadcast Tips",
    tip1: "Keep your messages concise and clear for better user experience",
    tip2: "Use broadcast messages sparingly to avoid overwhelming users",
    tip3: "Consider sending broadcasts during business hours when users are likely to see them",
    tip4: "Include a clear call-to-action if you want users to take specific steps",
    connectedUsersDesc: "Users with linked Telegram accounts",
    totalConnected: "Total connected users",
    userId: "User ID",
    telegramChatId: "Telegram Chat ID",
    linkedOn: "Linked on",
    messageThis: "Message",
    testMessageToUser: "This is a test message for user {userId} from the admin panel.",
    noConnectedUsers: "No connected users",
    noConnectedUsersDesc: "There are currently no users with linked Telegram accounts."
  },
  common: {
    loading: "Loading...",
    error: "An error occurred",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    back: "Back",
    submit: "Submit",
    next: "Next",
    prev: "Previous",
    add: "Add",
    remove: "Remove",
    welcome: "Welcome",
    logout: "Logout",
    theme: "Theme",
    language: "Language",
    profile: "Profile",
    settings: "Settings",
    notification: "Notification",
    appName: "SaaSly",
    optional: "Optional",
    date: "Date",
    restore: "Restore",
    information: "Information",
    refresh: "Refresh",
  },
  
  backups: {
    title: "Database Backups",
    manageBackups: "Manage database backups",
    createBackup: "Create Backup",
    restoreBackup: "Restore Backup",
    deleteBackup: "Delete Backup",
    backupName: "Backup Name",
    backupSize: "Size",
    backupDate: "Date",
    manualBackup: "Manual Backup",
    scheduledBackup: "Scheduled Backup",
    setupSchedule: "Setup Schedule",
    confirmRestore: "Are you sure you want to restore this backup? All current data will be replaced.",
    confirmDelete: "Are you sure you want to delete this backup?",
    noBackups: "No backups found",
    backupCreated: "Backup created successfully",
    backupRestored: "Backup restored successfully",
    backupDeleted: "Backup deleted successfully",
    cleanOldBackups: "Clean Old Backups",
    keepCount: "Keep Count",
    scheduleInterval: "Schedule Interval (hours)",
  },

  auth: {
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    magicLink: "Magic Link",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Full Name",
    company: "Company Name",
    phone: "Phone Number",
    loginAction: "Sign In",
    registerAction: "Sign Up",
    logoutAction: "Sign Out",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    emailSent: "Email sent!",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "John Doe",
    companyPlaceholder: "Acme Inc.",
    phonePlaceholder: "+1 (555) 123-4567",
    sendMagicLink: "Send Magic Link",
    magicLinkSent: "Magic link sent! Check your email for login instructions.",
    createAccount: "Create Account",
    creatingAccount: "Creating account...",
    signingIn: "Signing in...",
    sendingLink: "Sending link...",
    enterCredentials: "Enter your credentials to access your account",
    fillDetails: "Fill in your details to create a new account",
    enterEmail: "Enter your email to receive a sign-in link",
    rememberPassword: "Remember your password?",
    welcomeTitle: "Welcome to SaaSly",
    welcomeSubtitle: "The all-in-one platform to manage your SaaS subscriptions efficiently. Track expenses, manage licenses, and optimize your software stack.",
    feature1Title: "Subscription Management",
    feature1Desc: "Track all your SaaS subscriptions in one place",
    feature2Title: "Cost Optimization",
    feature2Desc: "Monitor expenses and optimize your spending",
    feature3Title: "Insights and Analytics",
    feature3Desc: "Get valuable insights on your SaaS usage",
  },

  nav: {
    dashboard: "Dashboard",
    users: "Users",
    services: "Services",
    subscriptions: "Subscriptions",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
    help: "Help & Support",
  },

  dashboard: {
    title: "Dashboard",
    quickAction: "Quick Actions",
    newSubscription: "New Subscription",
    newService: "New Service",
    manageSubscriptions: "Manage Subscriptions",
    viewSubscriptions: "View Subscriptions",
    browseServices: "Browse Services",
    viewServices: "View Services",
    userManagement: "User Management",
    manageUsers: "Manage Users",
    accountSettings: "Account Settings",
    viewProfile: "View Profile",
    stats: "Stats",
    total: "Total",
    active: "Active",
    inactive: "Inactive",
    subscriptionStats: "Subscription Stats",
    userStats: "User Stats",
    recentActivity: "Recent Activity",
    popularServices: "Popular Services",
    recentSubscriptions: "Recent Subscriptions",
    activeServices: "Active Services",
  },

  services: {
    title: "Services",
    manageServices: "Manage available services for your clients",
    browseServices: "Browse available services for subscriptions",
    addService: "Add Service",
    editService: "Edit Service",
    serviceTitle: "Service Title",
    serviceDescription: "Description",
    serviceIcon: "Icon URL",
    cashback: "Cashback",
    customFields: "Custom Fields",
    customFieldsDesc: "Additional fields for this service",
    editCustomFields: "Edit Custom Fields",
    editCustomFieldsDesc: "Add or modify additional fields for this service",
    fieldName: "Field Name",
    fieldNamePlaceholder: "Enter field name",
    fieldType: "Field Type",
    fieldTypeText: "Text",
    fieldTypeNumber: "Number",
    fieldTypeBoolean: "Yes/No",
    fieldTypeDate: "Date",
    fieldTypeSelect: "Dropdown",
    selectFieldType: "Select field type",
    defaultValue: "Default Value",
    defaultValuePlaceholder: "Enter default value",
    selectOptionsHint: "For dropdown fields, enter options separated by commas",
    visibleToUsers: "Visible to Users",
    visibleToUsersDesc: "Show this field to regular users",
    addCustomField: "Add Custom Field",
    addCustomFieldsPrompt: "No custom fields yet. Click the button below to add your first custom field.",
    fieldNumber: "Field {number}",
    noCustomFields: "No custom fields found for this service",
    noCustomFieldsAdmin: "No custom fields defined yet. Click Edit to add custom fields.",
    adminOnly: "Admin only",
    customFieldsUpdated: "Custom fields updated",
    customFieldsUpdatedDesc: "The custom fields have been successfully updated",
    customFieldsDeleted: "Custom fields deleted",
    customFieldsDeletedDesc: "All custom fields have been successfully deleted",
    confirmDeleteAllFields: "Delete all custom fields?",
    confirmDeleteAllFieldsDesc: "This action will delete all custom fields for this entity and cannot be undone.",
    createService: "Create Service",
    updateService: "Update Service",
    confirmDelete: "Are you sure you want to delete this service?",
    noServices: "No services found",
    serviceDetails: "Service Details",
    serviceCreated: "Service created successfully",
    serviceUpdated: "Service updated successfully",
    serviceDeleted: "Service deleted successfully",
    servicesByCount: "Top services by subscription count",
    availableServices: "Available Services",
    availableToSubscribe: "Available to subscribe",
  },

  subscriptions: {
    title: "Subscriptions",
    manageSubscriptions: "Manage all your active service subscriptions",
    addSubscription: "Add Subscription",
    editSubscription: "Edit Subscription",
    subscriptionTitle: "Subscription Title",
    service: "Service",
    domain: "Domain",
    loginId: "Login ID",
    paymentPeriod: "Payment Period",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    paymentAmount: "Payment Amount",
    paidUntil: "Paid Until",
    licensesCount: "Licenses Count",
    usersCount: "Users Count",
    status: "Status",
    statusActive: "Active",
    statusPending: "Pending",
    statusExpired: "Expired",
    statusCanceled: "Canceled",
    createSubscription: "Create Subscription",
    updateSubscription: "Update Subscription",
    confirmDelete: "Are you sure you want to delete this subscription?",
    noSubscriptions: "No subscriptions found",
    subscriptionDetails: "Subscription Details",
    subscriptionCreated: "Subscription created successfully",
    subscriptionUpdated: "Subscription updated successfully",
    subscriptionDeleted: "Subscription deleted successfully",
    mySubscriptions: "My Subscriptions",
    active: "Active",
    activeUntil: "Active Until",
    nextPayment: "Next Payment",
  },

  users: {
    title: "User Management",
    manageUsers: "Manage user accounts and permissions",
    addUser: "Add User",
    editUser: "Edit User",
    userEmail: "Email",
    userName: "Name",
    userCompany: "Company",
    userPhone: "Phone",
    userRole: "Role",
    roleAdmin: "Admin",
    roleClient: "Client",
    status: "Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    createUser: "Create User",
    updateUser: "Update User",
    confirmDelete: "Are you sure you want to delete this user?",
    noUsers: "No users found",
    userDetails: "User Details",
    userCreated: "User created successfully",
    userUpdated: "User updated successfully",
    userDeleted: "User deleted successfully",
  },

  profile: {
    title: "Profile Settings",
    personalInfo: "Profile",
    accountSettings: "Account Settings",
    updateProfile: "Update Profile",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    profileUpdated: "Profile updated successfully",
    passwordUpdated: "Password updated successfully",
    role: "Role",
    accountStatus: "Account Status",
    active: "Active",
    memberSince: "Member since",
  },
  
  telegram: {
    title: "Telegram Connection",
    description: "Connect your Telegram account to receive notifications",
    connect: "Connect Telegram",
    connected: "Connected",
    notConnected: "Not connected to Telegram yet",
    generateLink: "Generate Link Code",
    linkInstructions: "Follow these steps to connect your Telegram",
    openBot: "Open Telegram bot",
    sendCommand: "Send this command to the bot",
    afterLink: "After sending the command, you'll receive a confirmation message",
    receiveNotifications: "You'll now receive notifications about your subscriptions via Telegram",
    sendTestNotification: "Send Test Notification",
    testNotificationSent: "Test notification was sent successfully",
    disconnect: "Disconnect Telegram",
    disconnected: "Your Telegram account has been disconnected",
    confirmDisconnect: "Are you sure you want to disconnect your Telegram account?",
    disconnectWarning: "This action will disconnect your Telegram account from the system. You will stop receiving notifications. You can reconnect anytime.",
  },

  messages: {
    invalidCredentials: "Invalid email or password",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 6 characters",
    passwordsDoNotMatch: "Passwords do not match",
    unauthorized: "Unauthorized access",
    forbidden: "Access forbidden",
    notFound: "Not found",
    serverError: "Server error",
    welcomeBack: "Welcome back!",
    goodbye: "You have been logged out",
    invalidToken: "Invalid login link. Please request a new one.",
    expiredToken: "Login link has expired. Please request a new one.",
    userNotFound: "User not found with the provided email.",
    loginFailed: "Login failed. Please try again.",
    emailAlreadyExists: "Email already in use",
    invalidLink: "Invalid login link",
    linkExpired: "Login link has expired",
    somethingWentWrong: "Something went wrong. Please try again.",
  },
};

export const ru: Translation = {
  broadcast: {
    title: "Broadcast Messages",
    sendBroadcast: "Send Broadcast",
    connectedUsers: "Connected Users",
    newBroadcast: "New Broadcast Message",
    newBroadcastDesc: "Create a new message to send to all connected users",
    recipientFilter: "Recipient Filter",
    selectRecipients: "Select recipients",
    allUsers: "All Users",
    adminUsers: "Admin Users Only",
    clientUsers: "Client Users Only",
    recipientFilterDesc: "Choose which group of users will receive this message",
    messageContent: "Message Content",
    messageContentPlaceholder: "Enter your message here...",
    messageContentDesc: "This message will be sent to all selected users with connected Telegram accounts",
    sendNow: "Send Now",
    broadcastSent: "Broadcast sent",
    broadcastSentDesc: "Your message was sent to {success} users (failed: {failed})",
    broadcastFailed: "Broadcast failed",
    lastBroadcastResult: "Last broadcast result",
    deliveredCount: "Delivered",
    failedCount: "Failed",
    tips: "Broadcast Tips",
    tip1: "Keep your messages concise and clear for better user experience",
    tip2: "Use broadcast messages sparingly to avoid overwhelming users",
    tip3: "Consider sending broadcasts during business hours when users are likely to see them",
    tip4: "Include a clear call-to-action if you want users to take specific steps",
    connectedUsersDesc: "Users with linked Telegram accounts",
    totalConnected: "Total connected users",
    userId: "User ID",
    telegramChatId: "Telegram Chat ID",
    linkedOn: "Linked on",
    messageThis: "Message",
    testMessageToUser: "This is a test message for user {userId} from the admin panel.",
    noConnectedUsers: "No connected users",
    noConnectedUsersDesc: "There are currently no users with linked Telegram accounts."
  },
  common: {
    loading: "Загрузка...",
    error: "Произошла ошибка",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    search: "Поиск",
    back: "Назад",
    submit: "Отправить",
    next: "Далее",
    prev: "Назад",
    add: "Добавить",
    remove: "Удалить",
    welcome: "Добро пожаловать",
    logout: "Выйти",
    theme: "Тема",
    language: "Язык",
    profile: "Профиль",
    settings: "Настройки",
    notification: "Уведомление",
    appName: "SaaSly",
    optional: "Необязательно",
    date: "Дата",
    restore: "Восстановить",
    information: "Информация",
    refresh: "Обновить",
  },
  
  backups: {
    title: "Резервные копии базы данных",
    manageBackups: "Управление резервными копиями базы данных",
    createBackup: "Создать резервную копию",
    restoreBackup: "Восстановить из копии",
    deleteBackup: "Удалить копию",
    backupName: "Имя файла",
    backupSize: "Размер",
    backupDate: "Дата",
    manualBackup: "Создать вручную",
    scheduledBackup: "Запланированное копирование",
    setupSchedule: "Настроить расписание",
    confirmRestore: "Вы уверены, что хотите восстановить базу данных из этой копии? Все текущие данные будут заменены.",
    confirmDelete: "Вы уверены, что хотите удалить эту резервную копию?",
    noBackups: "Резервные копии не найдены",
    backupCreated: "Резервная копия успешно создана",
    backupRestored: "База данных успешно восстановлена из копии",
    backupDeleted: "Резервная копия успешно удалена",
    cleanOldBackups: "Очистить старые копии",
    keepCount: "Количество сохраняемых",
    scheduleInterval: "Интервал расписания (часы)",
  },

  auth: {
    login: "Вход",
    register: "Регистрация",
    forgotPassword: "Забыли пароль",
    magicLink: "Магическая ссылка",
    email: "Email",
    password: "Пароль",
    confirmPassword: "Подтвердите пароль",
    name: "Полное имя",
    company: "Название компании",
    phone: "Номер телефона",
    loginAction: "Войти",
    registerAction: "Зарегистрироваться",
    logoutAction: "Выйти",
    dontHaveAccount: "Нет аккаунта?",
    alreadyHaveAccount: "Уже есть аккаунт?",
    emailSent: "Письмо отправлено!",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "Иван Иванов",
    companyPlaceholder: "ООО Рога и Копыта",
    phonePlaceholder: "+7 (999) 123-4567",
    sendMagicLink: "Отправить магическую ссылку",
    magicLinkSent: "Магическая ссылка отправлена! Проверьте почту для входа.",
    createAccount: "Создать аккаунт",
    creatingAccount: "Создание аккаунта...",
    signingIn: "Вход в систему...",
    sendingLink: "Отправка ссылки...",
    enterCredentials: "Введите ваши данные для доступа к аккаунту",
    fillDetails: "Заполните данные для создания нового аккаунта",
    enterEmail: "Введите email для получения ссылки для входа",
    rememberPassword: "Вспомнили пароль?",
    welcomeTitle: "Добро пожаловать в SaaSly",
    welcomeSubtitle: "Универсальная платформа для эффективного управления SaaS-подписками. Отслеживайте расходы, управляйте лицензиями и оптимизируйте ваш софтверный стек.",
    feature1Title: "Управление подписками",
    feature1Desc: "Отслеживайте все ваши SaaS-подписки в одном месте",
    feature2Title: "Оптимизация затрат",
    feature2Desc: "Контролируйте расходы и оптимизируйте ваши затраты",
    feature3Title: "Аналитика и отчеты",
    feature3Desc: "Получайте полезные данные об использовании ваших SaaS-сервисов",
  },

  nav: {
    dashboard: "Дашборд",
    users: "Пользователи",
    services: "Сервисы",
    subscriptions: "Подписки",
    analytics: "Аналитика",
    profile: "Профиль",
    settings: "Настройки",
    help: "Помощь и поддержка",
  },

  dashboard: {
    title: "Дашборд",
    quickAction: "Быстрые действия",
    newSubscription: "Новая подписка",
    newService: "Новый сервис",
    manageSubscriptions: "Управление подписками",
    viewSubscriptions: "Просмотр подписок",
    browseServices: "Просмотр сервисов",
    viewServices: "Просмотр сервисов",
    userManagement: "Управление пользователями",
    manageUsers: "Управление пользователями",
    accountSettings: "Настройки аккаунта",
    viewProfile: "Просмотр профиля",
    stats: "Статистика",
    total: "Всего",
    active: "Активных",
    inactive: "Неактивных",
    subscriptionStats: "Статистика подписок",
    userStats: "Статистика пользователей",
    recentActivity: "Последние действия",
    popularServices: "Популярные сервисы",
    recentSubscriptions: "Последние подписки",
    activeServices: "Активные сервисы",
  },

  services: {
    title: "Сервисы",
    manageServices: "Управление доступными сервисами для ваших клиентов",
    browseServices: "Просмотр доступных сервисов для подписок",
    addService: "Добавить сервис",
    editService: "Редактировать сервис",
    serviceTitle: "Название сервиса",
    serviceDescription: "Описание",
    serviceIcon: "URL иконки",
    cashback: "Кэшбэк",
    customFields: "Дополнительные поля",
    customFieldsDesc: "Дополнительные поля для этого сервиса",
    editCustomFields: "Редактирование полей",
    editCustomFieldsDesc: "Добавление или изменение дополнительных полей для этого сервиса",
    fieldName: "Название поля",
    fieldNamePlaceholder: "Введите название поля",
    fieldType: "Тип поля",
    fieldTypeText: "Текст",
    fieldTypeNumber: "Число",
    fieldTypeBoolean: "Да/Нет",
    fieldTypeDate: "Дата",
    fieldTypeSelect: "Выпадающий список",
    selectFieldType: "Выберите тип поля",
    defaultValue: "Значение по умолчанию",
    defaultValuePlaceholder: "Введите значение по умолчанию",
    selectOptionsHint: "Для выпадающих списков введите варианты через запятую",
    visibleToUsers: "Видимо пользователям",
    visibleToUsersDesc: "Показывать это поле обычным пользователям",
    addCustomField: "Добавить поле",
    addCustomFieldsPrompt: "Нет дополнительных полей. Нажмите кнопку ниже, чтобы добавить первое поле.",
    fieldNumber: "Поле {number}",
    noCustomFields: "Дополнительные поля не найдены для этого сервиса",
    noCustomFieldsAdmin: "Дополнительные поля еще не определены. Нажмите Редактировать, чтобы добавить поля.",
    adminOnly: "Только для администраторов",
    customFieldsUpdated: "Дополнительные поля обновлены",
    customFieldsUpdatedDesc: "Дополнительные поля были успешно обновлены",
    customFieldsDeleted: "Дополнительные поля удалены",
    customFieldsDeletedDesc: "Все дополнительные поля были успешно удалены",
    confirmDeleteAllFields: "Удалить все дополнительные поля?",
    confirmDeleteAllFieldsDesc: "Это действие удалит все дополнительные поля для этого элемента и не может быть отменено.",
    createService: "Создать сервис",
    updateService: "Обновить сервис",
    confirmDelete: "Вы уверены, что хотите удалить этот сервис?",
    noServices: "Сервисы не найдены",
    serviceDetails: "Детали сервиса",
    serviceCreated: "Сервис успешно создан",
    serviceUpdated: "Сервис успешно обновлен",
    serviceDeleted: "Сервис успешно удален",
    servicesByCount: "Топ сервисов по количеству подписок",
    availableServices: "Доступные сервисы",
    availableToSubscribe: "Доступно для подписки",
  },

  subscriptions: {
    title: "Подписки",
    manageSubscriptions: "Управление всеми вашими активными подписками на сервисы",
    addSubscription: "Добавить подписку",
    editSubscription: "Редактировать подписку",
    subscriptionTitle: "Название подписки",
    service: "Сервис",
    domain: "Домен",
    loginId: "Логин ID",
    paymentPeriod: "Период оплаты",
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    yearly: "Ежегодно",
    paymentAmount: "Сумма оплаты",
    paidUntil: "Оплачено до",
    licensesCount: "Количество лицензий",
    usersCount: "Количество пользователей",
    status: "Статус",
    statusActive: "Активная",
    statusPending: "В ожидании",
    statusExpired: "Истекла",
    statusCanceled: "Отменена",
    createSubscription: "Создать подписку",
    updateSubscription: "Обновить подписку",
    confirmDelete: "Вы уверены, что хотите удалить эту подписку?",
    noSubscriptions: "Подписки не найдены",
    subscriptionDetails: "Детали подписки",
    subscriptionCreated: "Подписка успешно создана",
    subscriptionUpdated: "Подписка успешно обновлена",
    subscriptionDeleted: "Подписка успешно удалена",
    mySubscriptions: "Мои подписки",
    active: "Активные",
    activeUntil: "Активна до",
    nextPayment: "Следующий платёж",
  },

  users: {
    title: "Управление пользователями",
    manageUsers: "Управление учетными записями пользователей и разрешениями",
    addUser: "Добавить пользователя",
    editUser: "Редактировать пользователя",
    userEmail: "Email",
    userName: "Имя",
    userCompany: "Компания",
    userPhone: "Телефон",
    userRole: "Роль",
    roleAdmin: "Администратор",
    roleClient: "Клиент",
    status: "Статус",
    statusActive: "Активный",
    statusInactive: "Неактивный",
    createUser: "Создать пользователя",
    updateUser: "Обновить пользователя",
    confirmDelete: "Вы уверены, что хотите удалить этого пользователя?",
    noUsers: "Пользователи не найдены",
    userDetails: "Детали пользователя",
    userCreated: "Пользователь успешно создан",
    userUpdated: "Пользователь успешно обновлен",
    userDeleted: "Пользователь успешно удален",
  },

  profile: {
    title: "Настройки профиля",
    personalInfo: "Профиль",
    accountSettings: "Настройки аккаунта",
    updateProfile: "Обновить профиль",
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmNewPassword: "Подтвердите новый пароль",
    profileUpdated: "Профиль успешно обновлен",
    passwordUpdated: "Пароль успешно обновлен",
    role: "Роль",
    accountStatus: "Статус аккаунта",
    active: "Активен",
    memberSince: "Участник с",
  },
  
  broadcast: {
    title: "Массовые рассылки",
    sendBroadcast: "Отправить рассылку",
    connectedUsers: "Подключенные пользователи",
    newBroadcast: "Новое сообщение для рассылки",
    newBroadcastDesc: "Создайте новое сообщение для отправки всем подключенным пользователям",
    recipientFilter: "Фильтр получателей",
    selectRecipients: "Выберите получателей",
    allUsers: "Все пользователи",
    adminUsers: "Только администраторы",
    clientUsers: "Только клиенты",
    recipientFilterDesc: "Выберите группу пользователей, которые получат это сообщение",
    messageContent: "Содержание сообщения",
    messageContentPlaceholder: "Введите ваше сообщение здесь...",
    messageContentDesc: "Это сообщение будет отправлено всем выбранным пользователям с подключенными аккаунтами Telegram",
    sendNow: "Отправить сейчас",
    broadcastSent: "Рассылка отправлена",
    broadcastSentDesc: "Ваше сообщение было отправлено {success} пользователям (не доставлено: {failed})",
    broadcastFailed: "Ошибка рассылки",
    lastBroadcastResult: "Результат последней рассылки",
    deliveredCount: "Доставлено",
    failedCount: "Не доставлено",
    tips: "Советы по рассылкам",
    tip1: "Делайте сообщения краткими и понятными для лучшего восприятия",
    tip2: "Используйте рассылки экономно, чтобы не перегружать пользователей",
    tip3: "Отправляйте рассылки в рабочее время, когда пользователи с большей вероятностью их увидят",
    tip4: "Включайте четкий призыв к действию, если хотите, чтобы пользователи выполнили определенные шаги",
    connectedUsersDesc: "Пользователи с привязанными аккаунтами Telegram",
    totalConnected: "Всего подключенных пользователей",
    userId: "ID пользователя",
    telegramChatId: "ID чата Telegram",
    linkedOn: "Подключен",
    messageThis: "Написать",
    testMessageToUser: "Это тестовое сообщение для пользователя {userId} из админ-панели.",
    noConnectedUsers: "Нет подключенных пользователей",
    noConnectedUsersDesc: "В настоящее время нет пользователей с привязанными аккаунтами Telegram."
  },
  
  telegram: {
    title: "Подключение Telegram",
    description: "Подключите свою учетную запись Telegram для получения уведомлений",
    connect: "Подключить Telegram",
    connected: "Подключено",
    notConnected: "Еще не подключено к Telegram",
    generateLink: "Сгенерировать код подключения",
    linkInstructions: "Следуйте этим шагам для подключения Telegram",
    openBot: "Откройте бота в Telegram",
    sendCommand: "Отправьте эту команду боту",
    afterLink: "После отправки команды вы получите подтверждающее сообщение",
    receiveNotifications: "Теперь вы будете получать уведомления о ваших подписках через Telegram",
    sendTestNotification: "Отправить тестовое уведомление",
    testNotificationSent: "Тестовое уведомление успешно отправлено",
    disconnect: "Отключить Telegram",
    disconnected: "Ваш аккаунт Telegram был отключен",
    confirmDisconnect: "Вы уверены, что хотите отключить свой аккаунт Telegram?",
    disconnectWarning: "Это действие отключит ваш аккаунт Telegram от системы. Вы перестанете получать уведомления. Вы можете снова подключиться в любое время.",
  },

  messages: {
    invalidCredentials: "Неверный email или пароль",
    requiredField: "Это поле обязательно",
    invalidEmail: "Пожалуйста, введите корректный email",
    passwordTooShort: "Пароль должен содержать минимум 6 символов",
    passwordsDoNotMatch: "Пароли не совпадают",
    unauthorized: "Неавторизованный доступ",
    forbidden: "Доступ запрещен",
    notFound: "Не найдено",
    serverError: "Ошибка сервера",
    welcomeBack: "С возвращением!",
    goodbye: "Вы вышли из системы",
    invalidToken: "Неверная ссылка для входа. Пожалуйста, запросите новую.",
    expiredToken: "Ссылка для входа истекла. Пожалуйста, запросите новую.",
    userNotFound: "Пользователь с указанным email не найден.",
    loginFailed: "Ошибка входа. Пожалуйста, попробуйте снова.",
    emailAlreadyExists: "Email уже используется",
    invalidLink: "Неверная ссылка для входа",
    linkExpired: "Ссылка для входа истекла",
    somethingWentWrong: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
  },
};