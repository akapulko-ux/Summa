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
    select: string;
    enter: string;
    refresh: string;
    no_data: string;
    yes: string;
    no: string;
    deleteAll: string;
    active: string;
    inactive: string;
    general: string;
    saveFirstToConfigureThis: string;
    filter: string;
    sortBy: string;
    sortOrder: string;
    ascending: string;
    descending: string;
    clearFilters: string;
    applyFilters: string;
    filterOptions: string;
    sortOptions: string;
    status: string;
    copy: string;
    copied: string;
    createdAt: string;
    updatedAt: string;
    actions: string;
    change: string;
    uploadFile: string;
  };
  
  // Кэш
  cache: {
    title: string;
    total_hits: string;
    hits_desc: string;
    efficiency: string;
    efficiency_desc: string;
    clear: string;
    cleared: string;
    cleared_desc: string;
    no_data: string;
  };
  
  // Мониторинг производительности
  monitoring: {
    title: string;
    description: string;
    totalQueries: string;
    avgResponseTime: string;
    cacheUsageRatio: string;
    potentialCacheHits: string;
    queryStats: string;
    poolStatus: string;
    totalConnections: string;
    idleConnections: string;
    waitingClients: string;
    query: string;
    count: string;
    avgTime: string;
    ms: string;
    percent: string;
    refreshStats: string;
    analyzeQuery: string;
    queryText: string;
    optimizationTips: string;
    noStats: string;
    databasePerformance: string;
    cachePerformance: string;
    queryPerformance: string;
    connectionStatus: string;
    
    // Дополнительные поля для страницы мониторинга
    db_status: string;
    db_desc: string;
    connections: string;
    performance: string;
    avg_time: string;
    avg_response: string;
    cache_ratio: string;
    query_desc: string;
    no_queries: string;
    system_info: string;
    system_desc: string;
    metrics: string;
    response_times: string;
    good_performance: string;
    consider_optimizing: string;
    total_stats: string;
    queries_executed: string;
    unique_queries: string;
    toggle: string;
    enabled: string;
    disabled: string;
    monitoring_on: string;
    monitoring_off: string;
    no_data_desc: string;
    enable_monitoring: string;
  };
  
  // Layout
  layout: {
    adminPanel: string;
    notifications: string;
    noNotifications: string;
    userMenu: string;
    toggleTheme: string;
    toggleSidebar: string;
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
    
    // Новые поля для расширенных функций
    uploadBackup: string;
    downloadBackup: string;
    backupTypes: string;
    backupFormats: string;
    advancedRestore: string;
    metadataInfo: string;
    
    // Типы бэкапов
    typeManual: string;
    typeAuto: string;
    typePreRestore: string;
    typeImported: string;
    typeUnknown: string;
    
    // Поля для загрузки файлов
    selectBackupFile: string;
    supportedFormats: string;
    namePrefix: string;
    uploadButton: string;
    uploading: string;
    
    // Поля для расширенного восстановления
    createBackupFirst: string;
    onlyStructure: string;
    onlyData: string;
    selectSchemas: string;
    selectTables: string;
    restoreFilters: string;
    restoreType: string;
    schemas: string;
    tables: string;
    advancedOptions: string;
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
    inn: string;
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
    innPlaceholder: string;
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
    loginSuccess: string;
    loggedOut: string;
    loggedOutSuccess: string;
    loginFailed: string;
    logoutFailed: string;
    registrationSuccess: string;
    registrationFailed: string;
    accountCreated: string;
    magicLinkSent: string;
    magicLinkFailed: string;
    checkEmail: string;
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
    reports: string;
    backups: string;
    monitoring: string;
  };
  
  // Аналитика и графики
  analytics: {
    revenue: string;
    users: string;
    services: string;
    cashback: string;
    activity: string;
    userGrowth: string;
    serviceRevenue: string;
    totalRevenue: string;
    revenueDistribution: string;
    clientActivity: string;
    activeVsInactive: string;
    subscriptionCosts: string;
    loadingData: string;
    loadingRevenue: string;
    loadingDistribution: string;
    loadingUserGrowth: string;
    loadingActivity: string;
    loadingCashback: string;
    loadingServices: string;
    loadingPopularServices: string;
    loadingServiceRevenue: string;
    loadingSubscriptionCosts: string;
    cashbackAnalytics: string;
    cashbackAmount: string;
    cashbackSummary: string;
    totalCashback: string;
    latestCashback: string;
    revenueByService: string;
    period: string;
    selectPeriod: string;
    daily: string;
    weekly: string;
    monthly: string;
    quarterly: string;
    yearly: string;
    pickDate: string;
    newUsers: string;
    popularServices: string;
    servicesByCount: string;
    avgMinMaxPrices: string;
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
  cashback: {
    cashback: string;
    cashback_balance: string;
    cashback_history: string;
    add_cashback: string;
    client: string;
    amount: string;
    description: string;
    select_client: string;
    processing: string;
    cashback_added_success: string;
    cashback_add_error: string;
    success: string;
    error: string;
    error_loading_data: string;
    try_again: string;
    no_cashback_transactions: string;
    date: string;
    cashback_admin_description: string;
    cashback_client_description: string;
    cashback_description_placeholder: string;
  };

  services: {
    title: string;
    manageServices: string;
    browseServices: string;
    addService: string;
    editService: string;
    serviceTitle: string;
    serviceDescription: string;
    serviceDescriptionPlaceholder: string;
    cashbackDescription: string;
    commissionDescription: string;
    serviceIcon: string;
    serviceIconDescription: string;
    editServiceDescription: string;
    iconSavedInDatabase: string;
    cashback: string;
    commission: string;
    customFields: string;
    customFieldsDesc: string;
    advancedFields: string; // Новый перевод "Расширенные поля"
    editCustomFields: string;
    editCustomFieldsDesc: string;
    search: string;
    filterDesc: string;
    statusAll: string;
    sortOrder: string;
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
    requiredField: string;
    requiredFieldDesc: string;
    minValue: string;
    maxValue: string;
    validationRules: string;
    validationRulesDesc: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    patternDesc: string;
    patternPlaceholder: string;
    optionsHint: string;
    advancedOptions: string;
    fieldOptions: string;
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
    totalCashback: string;
    totalCashbackDescription: string;
    totalCashbackAmount: string;
    totalCashbackAmountDescription: string;
    // New fields for service details view
    details: string;
    clients: string;
    serviceClients: string;
    clientsDescription: string;
    noClients: string;
    active: string;
    inactive: string;
    // Custom services
    customService: string;
    createCustomService: string;
    myCustomServices: string;
    allServices: string;
    ownedBy: string;
  };

  // Подписки
  subscriptions: {
    title: string;
    description: string;
    manageSubscriptions: string;
    addSubscription: string;
    editSubscription: string;
    subscriptionTitle: string;
    service: string;
    selectedService: string;
    noServiceSelected: string;
    enterServiceName: string;
    customServiceName: string;
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
    allSubscriptions: string;
    allSubscriptionsDescription: string;
    searchPlaceholder: string;
    searchService: string;
    searchUser: string;
    searchDomain: string;
    serviceName: string;
    otherCustom: string;
    enterTitle: string;
    enterDomain: string;
    login: string;
    enterLogin: string;
    enterAmount: string;
    enterUsersCount: string;
    plan: string;
    selectPlan: string;
    searchCompany: string;
    noSubscriptionsFound: string;
    adjustFilters: string;
    viewDetails: string;
    viewUser: string;
    errorLoadingSubscriptions: string;
    searchHelp: string;
    filterDescription: string;
    columnVisibility: string;
    columnVisibilityDescription: string;
    priceMin: string;
    priceMax: string;
    startDateFrom: string;
    startDateTo: string;
    endDateFrom: string;
    endDateTo: string;
    resetColumns: string;
    filters: {
      selectStatus: string;
      statusAll: string;
      statusActive: string;
      statusPending: string;
      statusExpired: string;
      statusCanceled: string;
      selectSortField: string;
      sortService: string;
      sortUser: string;
      sortStatus: string;
      sortPrice: string;
      sortCreatedAt: string;
      sortOrder: string;
      selectSortOrder: string;
      priceMin: string;
      priceMax: string;
      startDateFrom: string;
      startDateTo: string;
      endDateFrom: string;
      endDateTo: string;
      sortOptionsDescription: string;
    };
    columns: {
      service: string;
      user: string;
      status: string;
      price: string;
      period: string;
      createdAt: string;
      actions: string;
      startDate: string;
      endDate: string;
      amount: string;
    };
    status: {
      active: string;
      pending: string;
      expired: string;
      canceled: string;
    };
    period: {
      monthly: string;
      quarterly: string;
      yearly: string;
    };
    
    // Новые поля для функциональности управления подписками
    addButton: string;
    addTitle: string;
    addDescription: string;
    addSuccess: string;
    addSuccessDescription: string;
    addError: string;
    deleteSuccess: string;
    deleteSuccessDescription: string;
    deleteError: string;
    amount: string;
    startDate: string;
    endDate: string;
    selectService: string;
    selectPeriod: string;
    selectStatus: string;
    optional: string;
    pickDate: string;
    user: string;
    select_user: string;
    service_name: string;
    enter_service_name: string;
    custom: string;
    created: string;
    created_desc: string;
    periods: {
      monthly: string;
      quarterly: string;
      yearly: string;
    };
    statuses: {
      active: string;
      pending: string;
      expired: string;
      canceled: string;
    };
    unknownService: string;
    errorLoading: string;
  };

  // Кастомные поля
  customFields: CustomFieldType;
  
  // Пользователи
  users: {
    title: string;
    manageUsers: string;
    addUser: string;
    editUser: string;
    manageSubscriptions: string;
    manageSubscriptionsDescription: string;
    manageCustomFields: string;
    manageCustomFieldsDescription: string;
    actions: string;
    edit: string;
    delete: string;
    filters: {
      status: string;
      selectStatus: string;
      statusAll: string;
      statusActive: string;
      statusInactive: string;
      sortBy: string;
      selectSortField: string;
      sortOrder: string;
      selectSortOrder: string;
      ascending: string;
      descending: string;
      company: string;
      enterCompany: string;
      sortName: string;
      sortEmail: string;
      sortCompany: string;
      sortCreatedAt: string;
    };
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
    showing: string;
    searchPlaceholder: string;
    errorLoading: string;
    noUsersFound: string;
    columns: {
      name: string;
      email: string;
      company: string;
      status: string;
      registration_date: string;
      subscriptions: string;
      cashback: string;
      actions: string;
    };
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
    profileUpdatedSuccess: string;
    passwordUpdated: string;
    role: string;
    accountStatus: string;
    active: string;
    memberSince: string;
  };
  
  // Массовые рассылки
  broadcast: {
    title: string;
    sendBroadcast: string;
    connectedUsers: string;
    newBroadcast: string;
    newBroadcastDesc: string;
    recipientFilter: string;
    selectRecipients: string;
    allUsers: string;
    adminUsers: string;
    clientUsers: string;
    recipientFilterDesc: string;
    messageContent: string;
    messageContentPlaceholder: string;
    messageContentDesc: string;
    sendNow: string;
    broadcastSent: string;
    broadcastSentDesc: string;
    broadcastFailed: string;
    lastBroadcastResult: string;
    deliveredCount: string;
    failedCount: string;
    tips: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
    connectedUsersDesc: string;
    totalConnected: string;
    userId: string;
    telegramChatId: string;
    linkedOn: string;
    messageThis: string;
    testMessageToUser: string;
    noConnectedUsers: string;
    noConnectedUsersDesc: string;
  };

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
    commandCopied: string;
    connectViaLink: string;
    orManualSteps: string;
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

// Добавим кастомные поля и типы
type CustomFieldType = {
  title: string;
  description: string;
  name: string;
  namePlaceholder: string;
  type: string;
  value: string;
  valuePlaceholder: string;
  options: string;
  optionsPlaceholder: string;
  optionsHelp: string;
  selectOption: string;
  selectType: string;
  addButton: string;
  addTitle: string;
  addDescription: string;
  addSuccess: string;
  addSuccessDescription: string;
  addError: string;
  deleteSuccess: string;
  deleteSuccessDescription: string;
  deleteError: string;
  confirmDelete: string;
  noCustomFields: string;
  createFirst: string;
  errorLoading: string;
  columns: {
    name: string;
    type: string;
    value: string;
    actions: string;
  };
  types: {
    text: string;
    number: string;
    boolean: string;
    date: string;
    select: string;
  };
};

export const en: Translation = {
  cashback: {
    cashback: "Cashback",
    cashback_balance: "Cashback Balance",
    cashback_history: "Cashback History",
    add_cashback: "Add Cashback",
    manage_cashback: "Cashback Management",
    client: "Client",
    amount: "Amount",
    description: "Description",
    select_client: "Select Client",
    processing: "Processing",
    cashback_added_success: "Cashback successfully added",
    cashback_subtracted_success: "Cashback successfully subtracted",
    cashback_add_error: "Error adding cashback",
    cashback_error: "Error managing cashback",
    insufficient_balance: "Insufficient cashback balance",
    insufficient_balance_detailed: "You don't have enough cashback balance to perform this operation",
    insufficient_balance_with_amount: "Cannot subtract {{amount}}₽ from your current balance of {{balance}}₽",
    success: "Success",
    transaction_history: "Transaction History",
    transaction_date: "Date",
    transaction_time: "Time",
    transaction_amount: "Amount",
    transaction_description: "Description",
    add_operation: "Added",
    subtract_operation: "Subtracted",
    no_transactions: "No transactions found",
    error: "Error",
    error_loading_data: "Error loading data",
    try_again: "Please try again",
    no_cashback_transactions: "No cashback transactions found",
    date: "Date",
    cashback_admin_description: "Use this form to manage cashback on client accounts",
    cashback_client_description: "Your current cashback balance and transaction history",
    cashback_description_placeholder: "Enter a description for this cashback transaction",
    current_balance: "Current Balance",
    operation_type: "Operation Type",
    add: "Add",
    subtract: "Subtract",
    earned_cashback: "Earned Cashback",
    current_cashback_balance: "Current cashback balance",
    current_cashback_balance_detailed: "Your current cashback balance that you can spend",
  },
  customFields: {
    title: "Custom Fields",
    description: "Manage custom fields for this entity",
    name: "Name",
    namePlaceholder: "Enter field name",
    type: "Type",
    value: "Value",
    valuePlaceholder: "Enter default value",
    options: "Options",
    optionsPlaceholder: "Option 1, Option 2, Option 3",
    optionsHelp: "Enter comma-separated list of options",
    selectOption: "Select an option",
    selectType: "Select field type",
    addButton: "Add Field",
    addTitle: "Add Custom Field",
    addDescription: "Create a new custom field for this entity",
    addSuccess: "Custom field added",
    addSuccessDescription: "The custom field has been successfully added",
    addError: "Error adding custom field",
    deleteSuccess: "Custom field deleted",
    deleteSuccessDescription: "The custom field has been successfully deleted",
    deleteError: "Error deleting custom field",
    confirmDelete: "Are you sure you want to delete this custom field?",
    noCustomFields: "No custom fields",
    createFirst: "Create your first custom field",
    errorLoading: "Error loading custom fields",
    columns: {
      name: "Name",
      type: "Type",
      value: "Value",
      actions: "Actions"
    },
    types: {
      text: "Text",
      number: "Number",
      boolean: "Boolean",
      date: "Date",
      select: "Select"
    }
  },
  common: {
    loading: "Loading...",
    error: "Error",
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
    appName: "Summa",
    optional: "Optional",
    date: "Date",
    restore: "Restore",
    information: "Information",
    select: "Select",
    enter: "Enter",
    success: "Operation completed successfully",
    amount: "Amount",
    users: "Users",
    usersCount: "Users Count",
    refresh: "Refresh",
    no_data: "No data available",
    notAvailable: "N/A",
    yes: "Yes",
    no: "No",
    deleteAll: "Delete All",
    active: "Active",
    inactive: "Inactive",
    general: "General",
    saveFirstToConfigureThis: "Save changes first before configuring this section",
    filter: "Filter",
    filters: "Filters",
    apply: "Apply",
    filterOptions: "Filter Options",
    sortBy: "Sort By",
    ascending: "Ascending",
    descending: "Descending",
    applyFilters: "Apply Filters",
    uploadFile: "Upload File",
    change: "Change",
    selectRole: "Select a role",
    sortOptions: "Sort Options",
    clearFilters: "Clear filters",
    status: "Status",
    createdAt: "Created at",
    updatedAt: "Updated at",
    actions: "Actions",
  },
  monitoring: {
    title: "Performance Monitoring",
    description: "Monitor and optimize your database performance",
    totalQueries: "Total Queries",
    avgResponseTime: "Average Response Time",
    cacheUsageRatio: "Cache Usage Ratio",
    potentialCacheHits: "Potential Cache Hits",
    queryStats: "Query Statistics",
    poolStatus: "Pool Status",
    totalConnections: "Total Connections",
    idleConnections: "Idle Connections",
    waitingClients: "Waiting Clients",
    query: "Query",
    count: "Count",
    avgTime: "Average Time",
    ms: "ms",
    percent: "%",
    refreshStats: "Refresh Statistics",
    analyzeQuery: "Analyze Query",
    queryText: "Query Text",
    optimizationTips: "Optimization Tips",
    noStats: "No statistics available",
    databasePerformance: "Database Performance",
    cachePerformance: "Cache Performance",
    queryPerformance: "Query Performance",
    connectionStatus: "Connection Status",
    
    // Дополнительные поля для страницы мониторинга
    db_status: "Database Status",
    db_desc: "Current database connection and performance information",
    connections: "Active connections",
    performance: "Performance metrics",
    avg_time: "Average query time",
    avg_response: "Average response time",
    cache_ratio: "Cache usage ratio",
    query_desc: "Information about executed database queries",
    no_queries: "No query statistics available. Enable monitoring to collect data.",
    system_info: "System Information",
    system_desc: "Metrics about system performance and resource usage",
    metrics: "Metrics",
    response_times: "Response Times",
    good_performance: "Good performance, response times below 100ms",
    consider_optimizing: "Consider optimizing slow queries",
    total_stats: "Total Statistics",
    queries_executed: "Queries executed",
    unique_queries: "Unique queries",
    toggle: "Enable query monitoring",
    enabled: "Monitoring Enabled",
    disabled: "Monitoring Disabled",
    monitoring_on: "Performance monitoring is now active",
    monitoring_off: "Performance monitoring has been turned off",
    no_data_desc: "No database statistics available",
    enable_monitoring: "Enable monitoring to start collecting metrics"
  },
  
  cache: {
    title: "Cache Status",
    total_hits: "Cache Hits",
    hits_desc: "Number of requests served from cache",
    efficiency: "Cache Efficiency",
    efficiency_desc: "Percentage of requests served from cache",
    clear: "Clear Cache",
    cleared: "Cache Cleared",
    cleared_desc: "The cache has been successfully cleared",
    no_data: "No cache data available"
  },
  analytics: {
    revenue: "Revenue",
    users: "Users",
    services: "Services",
    cashback: "Cashback",
    activity: "Activity",
    userGrowth: "User Growth",
    serviceRevenue: "Service Revenue",
    totalRevenue: "Total Revenue",
    revenueDistribution: "Revenue Distribution",
    clientActivity: "Client Activity",
    activeVsInactive: "Active vs Inactive",
    subscriptionCosts: "Subscription Costs",
    loadingData: "Loading data...",
    loadingRevenue: "Loading revenue data...",
    loadingDistribution: "Loading distribution data...",
    loadingUserGrowth: "Loading user growth data...",
    loadingActivity: "Loading activity data...",
    loadingCashback: "Loading cashback data...",
    loadingServices: "Loading services data...",
    loadingPopularServices: "Loading popular services...",
    loadingServiceRevenue: "Loading service revenue data...",
    loadingSubscriptionCosts: "Loading subscription cost data...",
    cashbackAnalytics: "Cashback Analytics",
    cashbackAmount: "Cashback amount by period",
    cashbackSummary: "Cashback Summary",
    totalCashback: "Total Cashback",
    latestCashback: "Latest Cashback",
    revenueByService: "Revenue by service",
    period: "Period",
    selectPeriod: "Select period",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    pickDate: "Pick a date",
    newUsers: "New Users",
    popularServices: "Popular Services",
    servicesByCount: "Services by subscription count",
    avgMinMaxPrices: "Average, min and max subscription prices",
  },
  
  reports: {
    title: "Reports",
    generateReport: "Generate Report",
    generateReportDesc: "Create customized reports based on your data",
    recentReports: "Recent Reports",
    recentReportsDesc: "Your recently generated reports",
    reportType: "Report Type",
    format: "Format",
    startDate: "Start Date",
    endDate: "End Date",
    generating: "Generating Report...",
    selectReportType: "Select a report type",
    selectFormat: "Select a format",
    viewAllReports: "View All Reports",
    pickDate: "Pick a date",
    language: "Report Language",
    reportGenerated: "Report Generated Successfully",
    reportGeneratedDesc: "Your report has been generated and is ready for download",
    downloadReport: "Download Report",
    deleteReport: "Delete Report",
    noReports: "No Reports Found",
    noReportsDesc: "You haven't generated any reports yet",
    confirmDelete: "Are you sure you want to delete this report?",
    reportDeleted: "Report deleted successfully",
    errorGenerating: "Error generating report",
    errorDownloading: "Error downloading report",
    dateCreated: "Date Created",
    fileSize: "File Size",
    reportsList: "Reports List",
    
    // Report types
    subscriptionReport: "Subscription Report",
    subscriptionReportDesc: "Detailed information about subscriptions and revenue",
    userReport: "User Report",
    userReportDesc: "User growth and activity statistics",
    servicesReport: "Services Report",
    servicesReportDesc: "Service usage and popularity",
    financialReport: "Financial Report",
    financialReportDesc: "Revenue, expenses and profit information",
    trendsReport: "Trends Report",
    trendsReportDesc: "Trends and forecasts based on historical data",
    
    // Sample reports
    subscriptionReportSample: "Subscription Report",
    userGrowthReportSample: "User Growth Report",
    financialReportSample: "Financial Report Q1",
    
    // Report formats
    pdfDocument: "PDF Document",
    excelSpreadsheet: "Excel Spreadsheet",
    csvFile: "CSV File",
  },

  layout: {
    adminPanel: "Admin Panel",
    notifications: "Notifications",
    noNotifications: "No new notifications",
    userMenu: "User Menu",
    toggleTheme: "Toggle Theme",
    toggleSidebar: "Toggle Sidebar"
  },
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
    
    // New fields for advanced features
    uploadBackup: "Upload Backup",
    downloadBackup: "Download Backup",
    backupTypes: "Backup Types",
    backupFormats: "Backup Formats",
    advancedRestore: "Advanced Restore",
    metadataInfo: "Backup Information",
    
    // Backup types
    typeManual: "Manual",
    typeAuto: "Auto",
    typePreRestore: "Pre-restore",
    typeImported: "Imported",
    typeUnknown: "Unknown",
    
    // Upload file fields
    selectBackupFile: "Backup File",
    supportedFormats: "Supported formats: .sql, .dump, .dir, .tar, .zip",
    namePrefix: "Name Prefix",
    uploadButton: "Upload",
    uploading: "Uploading...",
    
    // Advanced restore fields
    createBackupFirst: "Create backup before restoring",
    onlyStructure: "Restore structure only (no data)",
    onlyData: "Restore data only (keep structure unchanged)",
    selectSchemas: "Schemas (comma-separated)",
    selectTables: "Tables (comma-separated)",
    restoreFilters: "Restore Filters",
    restoreType: "Restore Type",
    schemas: "Schemas",
    tables: "Tables",
    advancedOptions: "Advanced Options",
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
    inn: "Taxpayer ID",
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
    innPlaceholder: "1234567890",
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
    welcomeTitle: "Welcome to Сумма",
    welcomeSubtitle: "The all-in-one platform to manage your SaaS subscriptions efficiently. Track expenses, manage licenses, and optimize your software stack.",
    feature1Title: "Subscription Management",
    feature1Desc: "Track all your SaaS subscriptions in one place",
    feature2Title: "Cost Optimization",
    feature2Desc: "Monitor expenses and optimize your spending",
    feature3Title: "Insights and Analytics",
    feature3Desc: "Get valuable insights on your SaaS usage",
    loginSuccess: "Login successful",
    loggedOut: "Logged out",
    loggedOutSuccess: "You have been logged out successfully",
    loginFailed: "Login failed",
    logoutFailed: "Logout failed",
    registrationSuccess: "Registration successful",
    registrationFailed: "Registration failed",
    accountCreated: "Your account has been created",
    magicLinkSent: "Magic link sent",
    magicLinkFailed: "Failed to send magic link",
    checkEmail: "Check your email for a login link",
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
    reports: "Reports",
    backups: "Backups",
    notifications: "Notifications",
    monitoring: "Monitoring",
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
    accountSettings: "Contact Us",
    viewProfile: "Message on Telegram",
    messageUs: "If you have a question, write to us",
    stats: "Stats",
    total: "Total",
    active: "Active",
    inactive: "Inactive",
    subscriptionStats: "Subscription Stats",
    userStats: "User Stats",
    totalUsers: "Total Users",
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
    serviceDescriptionPlaceholder: "A suite of cloud computing, productivity and collaboration tools...",
    cashbackDescription: "Enter a percentage with % symbol (e.g., 5%) or a fixed amount (e.g., 10.00)",
    commissionDescription: "Enter a commission with % symbol (e.g., 5%) or a fixed amount (e.g., 10.00)",
    serviceIcon: "Service Icon",
    serviceIconDescription: "Upload an icon image in JPG or PNG format",
    editServiceDescription: "Edit the details of this service",
    iconSavedInDatabase: "Icon saved in database",
    cashback: "Cashback",
    commission: "Commission",
    customFields: "Custom Fields",
    customFieldsDesc: "Additional fields for this service",
    advancedFields: "Advanced Fields",
    editCustomFields: "Edit Custom Fields",
    editCustomFieldsDesc: "Add or modify additional fields for this service",
    search: "Search services...",
    filterDesc: "Filter and sort services",
    statusAll: "All statuses",
    sortOrder: "Sort order",
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
    requiredField: "Required Field",
    requiredFieldDesc: "Make this field mandatory for users to fill in",
    minValue: "Minimum Value",
    maxValue: "Maximum Value",
    validationRules: "Validation Rules",
    validationRulesDesc: "Set rules to ensure data quality",
    minLength: "Minimum Length",
    maxLength: "Maximum Length",
    pattern: "Pattern (Regex)",
    patternDesc: "Regular expression for validation",
    patternPlaceholder: "e.g. ^[A-Za-z0-9]+$",
    optionsHint: "Enter options below",
    advancedOptions: "Advanced Options",
    fieldOptions: "Field Options",
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
    totalCashback: "Total Cashback",
    totalCashbackDescription: "Sum of all cashbacks from your subscriptions",
    totalCashbackAmount: "Total Cashback Amount",
    totalCashbackAmountDescription: "Total amount of all cashbacks received",
    // New fields for service details view
    details: "Details",
    clients: "Clients",
    serviceClients: "Service Clients",
    clientsDescription: "List of clients using this service",
    noClients: "No clients are using this service",
    active: "Active",
    inactive: "Inactive",
    // Custom services
    customService: "Custom Service",
    createCustomService: "Create Custom Service",
    myCustomServices: "My Custom Services",
    allServices: "All Services",
    ownedBy: "Owned by",
    hideCustomServices: "Hide Custom Services",
    showCustomServices: "Show Custom Services",
    addToSubscriptions: "Add to Subscriptions",
    buy: "Buy",
    leaveRequest: "Leave Request",
    buyNow: "Buy Now",
  },
  
  leads: {
    title: "Request Service",
    description: "Submit your request for this service",
    name: "Your Name",
    phone: "Phone Number",
    emailOptional: "Email (optional)",
    submitRequest: "Submit Request",
    requestSubmitted: "Request Submitted",
    requestSubmittedDesc: "Your request has been submitted successfully. We will contact you shortly.",
    requestFailed: "Request Failed",
    requestFailedDesc: "Failed to submit your request. Please try again.",
    enterName: "Enter your name",
    enterPhone: "Enter your phone number",
    enterEmail: "Enter your email (optional)",
  },

  subscriptions: {
    title: "Subscriptions",
    description: "Manage your subscriptions to various services",
    manageSubscriptions: "Manage all your active service subscriptions",
    addSubscription: "Add Subscription",
    editSubscription: "Edit Subscription",
    editTitle: "Edit Subscription",
    editDescription: "Update the subscription information",
    subscriptionTitle: "Subscription Title",
    showing: "Showing",
    startDate: "Start Date",
    endDate: "End Date",
    service: "Service",
    selectService: "Select a service",
    selectedService: "Selected Service",
    noServiceSelected: "No service selected",
    enterServiceName: "Enter service name",
    customServiceName: "Custom Service",
    domain: "Domain",
    loginId: "Login ID",
    serviceName: "Service Name",
    otherCustom: "Other (Custom)",
    renewalAmount: "Renewal Amount",
    enterTitle: "Enter subscription title",
    enterDomain: "Enter domain",
    login: "Login",
    enterLogin: "Enter login",
    enterAmount: "Enter amount",
    enterUsersCount: "Enter users count",
    plan: "Plan",
    selectPlan: "Select plan",
    paymentPeriod: "Payment Period",
    monthly: "Monthly",
    monthlyNew: "Monthly",
    longTerm: "Long Term",
    topUp: "Balance Top-up",
    other: "Other",
    quarterly: "Quarterly",
    yearly: "Yearly",
    paidUntil: "Paid Until",
    paymentAmount: "Payment Amount",
    licensesCount: "Licenses Count",
    enterLicensesCount: "Enter licenses count",
    usersCount: "Users Count",
    selectPeriod: "Select period",
    customFields: "Custom Fields",
    advancedFields: "Advanced Fields",
    showCustomFields: "Show Custom Fields",
    cashback: "Cashback",
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
    created: "Subscription created",
    created_desc: "Your subscription has been created successfully",
    mySubscriptions: "My Subscriptions",
    active: "Active",
    activeUntil: "Active until",
    nextPayment: "Next payment",
    service_name: "Service Name",
    enter_service_name: "Enter Service Name",
    custom: "Custom",
    periodValues: {
      monthly: "Monthly",
      quarterly: "Long Term",
      yearly: "Balance Top-up",
      other: "Other"
    },
    periods: {
      monthly: "Monthly",
      quarterly: "Long Term",
      yearly: "Balance Top-up",
      other: "Other"
    },
    statuses: {
      active: "Active",
      pending: "Pending",
      expired: "Expired",
      canceled: "Canceled"
    },
    allSubscriptions: "All Subscriptions",
    allSubscriptionsDescription: "View all subscriptions in the system",
    filterDescription: "Filter and sort subscriptions by various criteria",
    searchHelp: "Search in title, service, domain or user",
    columnVisibility: "Column Visibility",
    columnVisibilityDescription: "Choose which columns to display in the table",
    resetFilters: "Reset Filters",
    resetColumns: "Reset Columns",
    sortOptionsDescription: "Choose which field to sort by and in what order",
    searchService: "Search by service",
    searchUser: "Search by user",
    searchDomain: "Search by domain",
    searchCompany: "Search by company",
    addButton: "Add Subscription",
    addTitle: "Add Subscription",
    addDescription: "Create a new subscription by filling in the form",
    addSuccess: "Subscription added successfully",
    addSuccessDescription: "The subscription has been added successfully",
    addError: "Error adding subscription",
    deleteSuccess: "Subscription deleted",
    deleteSuccessDescription: "The subscription has been deleted successfully",
    deleteError: "Error deleting subscription",
    amount: "Amount",
    optional: "Optional",
    pickDate: "Pick a date",
    unknownService: "Unknown service",
    errorLoading: "Error loading subscriptions",
    noSubscriptionsFound: "No subscriptions found",
    adjustFilters: "Adjust filters",
    viewDetails: "View details",
    viewUser: "View user",
    errorLoadingSubscriptions: "Error loading subscriptions",
    user: "User",
    select_user: "Select user",
    columns: {
      service: "Service",
      user: "User",
      status: "Status",
      price: "Price",
      period: "Period",
      createdAt: "Created At",
      actions: "Actions",
      startDate: "Start Date",
      endDate: "End Date",
      paidUntil: "Paid Until",
      amount: "Amount",
      title: "Title"
    },
    filters: {
      selectStatus: "Select Status",
      statusAll: "All",
      statusActive: "Active",
      statusPending: "Pending",
      statusExpired: "Expired",
      statusCanceled: "Canceled",
      selectSortField: "Select Sort Field", 
      priceMin: "Min Price",
      priceMax: "Max Price",
      periodAll: "All Periods",
      startDateFrom: "Start Date From",
      startDateTo: "Start Date To",
      endDateFrom: "End Date From",
      endDateTo: "End Date To",
      paidUntilFrom: "Paid Until From",
      paidUntilTo: "Paid Until To",
      sortStartDate: "Start Date",
      sortEndDate: "End Date",
      sortPaidUntil: "Paid Until",
      sortDomain: "Domain",
      sortCreatedAt: "Created At",
      sortService: "Service",
      sortUser: "User",
      sortStatus: "Status",
      sortPrice: "Price",
      sortPeriod: "Period",
      sortTitle: "Title",
      sortOrder: "Sort Order", 
      selectSortOrder: "Select Order",
      sortOptionsDescription: "Choose which field to sort by and in what order"
    },
  },

  users: {
    title: "User Management",
    manageUsers: "Manage user accounts and permissions",
    addUser: "Add User",
    editUser: "Edit User",
    manageSubscriptions: "Manage Subscriptions",
    manageSubscriptionsDescription: "Manage your subscriptions to various services",
    manageCustomFields: "Custom Fields",
    manageCustomFieldsDescription: "Manage custom fields for this entity",
    userEmail: "Email",
    userName: "Name",
    userCompany: "Company",
    userPhone: "Phone",
    userRole: "Role",
    roleAdmin: "Admin",
    roleClient: "Client",
    searchCompany: "Search by company",
    status: "Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    createUser: "Create User",
    updateUser: "Update User",
    activeStatus: "Active Status",
    activeStatusDescription: "User will be able to log in if active",
    password: "Password",
    newPassword: "New Password (leave blank to keep current)",
    emailPlaceholder: "Enter email address",
    confirmDelete: "Are you sure you want to delete this user?",
    errorLoading: "Error loading users",
    noUsersFound: "No users found",
    adjustFilters: "Adjust filters",
    viewDetails: "View details",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    showing: "Showing {current} of {total} users",
    userCreated: "User created successfully",
    userUpdated: "User updated successfully",
    userDeleted: "User deleted successfully",
    addTitle: "Add User",
    addDescription: "Create a new user by filling in the form",
    addSuccess: "User added successfully",
    addSuccessDescription: "The user has been added successfully",
    addError: "Error adding user",
    emailPlaceholder: "user@example.com",
    namePlaceholder: "John Doe",
    companyPlaceholder: "Acme Inc.",
    phonePlaceholder: "+1 (555) 123-4567",
    activeStatus: "Active Status",
    activeStatusDescription: "User will be able to log in if active",
    newPassword: "New Password (leave blank to keep current)",
    password: "Password",
    columns: {
      name: "Name",
      email: "Email",
      company: "Company",
      status: "Status",
      registration_date: "Registration Date",
      role: "Role",
      subscriptions: "Subscriptions",
      cashback: "Cashback Balance",
      actions: "Actions"
    },
    filters: {
      selectStatus: "Select Status",
      statusAll: "All",
      statusActive: "Active",
      statusInactive: "Inactive",
      selectSortField: "Select Sort Field",
      sortName: "Name",
      sortEmail: "Email",
      sortCompany: "Company",
      sortCreatedAt: "Created At",
      sortOrder: "Sort Order",
      selectSortOrder: "Select Order",
      sortOptionsDescription: "Choose which field to sort by and in what order"
    },
    noUsers: "No users found",
    userDetails: "User Details",
    userDetailsDescription: "View and edit user details",
    searchPlaceholder: "Search users..."
  },

  profile: {
    title: "Profile",
    personalInfo: "Personal Information",
    accountSettings: "Account Settings",
    updateProfile: "Update Profile",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    profileUpdated: "Profile updated successfully",
    profileUpdatedSuccess: "Your profile information has been saved",
    passwordUpdated: "Password updated successfully",
    role: "Role",
    accountStatus: "Account Status",
    active: "Active",
    memberSince: "Member since",
  },
  
  telegram: {
    title: "Telegram Connection",
    description: "Manage your Telegram integration",
    connect: "Connect Telegram",
    connected: "Connected to Telegram",
    notConnected: "Not connected to Telegram",
    generateLink: "Generate Connection Code",
    linkInstructions: "To connect your Telegram, follow these steps:",
    openBot: "Open Telegram and search for our bot",
    sendCommand: "Send the command /link {code} to the bot",
    afterLink: "After connecting, you will receive notifications and updates via Telegram",
    receiveNotifications: "You will receive notifications about your subscriptions and updates",
    sendTestNotification: "Send Test Notification",
    testNotificationSent: "Test notification sent successfully",
    disconnect: "Disconnect Telegram",
    disconnected: "Telegram successfully disconnected",
    confirmDisconnect: "Are you sure you want to disconnect your Telegram account?",
    disconnectWarning: "You will no longer receive notifications or updates via Telegram.",
    commandCopied: "Command copied to clipboard",
    connectViaLink: "Connect via Telegram",
    orManualSteps: "Or follow these steps manually:",
  },

  messages: {
    invalidCredentials: "Invalid email or password",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters long",
    passwordsDoNotMatch: "Passwords do not match",
    unauthorized: "Unauthorized access",
    forbidden: "You don't have permission to access this resource",
    notFound: "The requested resource was not found",
    serverError: "An error occurred on the server",
    welcomeBack: "Welcome back, {name}!",
    goodbye: "You have been logged out",
    invalidToken: "The token is invalid or has expired",
    expiredToken: "The token has expired",
    userNotFound: "User not found",
    loginFailed: "Login failed",
    emailAlreadyExists: "A user with this email already exists",
    invalidLink: "The link is invalid or has expired",
    linkExpired: "The link has expired",
    somethingWentWrong: "Something went wrong. Please try again later.",
  },
};

export const ru: Translation = {
  cashback: {
    cashback: "Кэшбэк",
    cashback_balance: "Баланс кэшбэка",
    cashback_history: "История кэшбэка",
    add_cashback: "Начислить кэшбэк",
    manage_cashback: "Управление кэшбэком",
    client: "Клиент",
    amount: "Сумма",
    description: "Описание",
    select_client: "Выберите клиента",
    processing: "Обработка",
    cashback_added_success: "Кэшбэк успешно начислен",
    cashback_subtracted_success: "Кэшбэк успешно списан",
    cashback_add_error: "Ошибка при начислении кэшбэка",
    cashback_error: "Ошибка при управлении кэшбэком",
    insufficient_balance: "Недостаточно средств на балансе кэшбэка",
    insufficient_balance_detailed: "На вашем балансе недостаточно средств для выполнения этой операции",
    insufficient_balance_with_amount: "Невозможно списать {{amount}}₽ с вашего текущего баланса {{balance}}₽",
    success: "Успешно",
    error: "Ошибка",
    transaction_history: "История операций",
    transaction_date: "Дата",
    transaction_time: "Время",
    transaction_amount: "Сумма",
    transaction_description: "Описание",
    add_operation: "Начислено",
    subtract_operation: "Списано",
    no_transactions: "Операции не найдены",
    error_loading_data: "Ошибка загрузки данных",
    try_again: "Пожалуйста, попробуйте еще раз",
    no_cashback_transactions: "Транзакции кэшбэка не найдены",
    date: "Дата",
    cashback_admin_description: "Используйте эту форму для управления кэшбэком клиентов",
    cashback_client_description: "Ваш текущий баланс кэшбэка и история транзакций",
    cashback_description_placeholder: "Введите описание для этой транзакции кэшбэка",
    current_balance: "Текущий баланс",
    operation_type: "Тип операции",
    add: "Начислить",
    subtract: "Списать",
    earned_cashback: "Начисленный кэшбэк",
    current_cashback_balance: "Текущий баланс кэшбэка",
    current_cashback_balance_detailed: "Ваш текущий баланс кэшбэка, который можно потратить",
  },
  customFields: {
    title: "Пользовательские поля",
    description: "Управление пользовательскими полями для этого объекта",
    name: "Название",
    namePlaceholder: "Введите название поля",
    type: "Тип",
    value: "Значение",
    valuePlaceholder: "Введите значение по умолчанию",
    options: "Варианты",
    optionsPlaceholder: "Вариант 1, Вариант 2, Вариант 3",
    optionsHelp: "Введите список вариантов через запятую",
    selectOption: "Выберите вариант",
    selectType: "Выберите тип поля",
    addButton: "Добавить поле",
    addTitle: "Добавить пользовательское поле",
    addDescription: "Создать новое пользовательское поле для этого объекта",
    addSuccess: "Пользовательское поле добавлено",
    addSuccessDescription: "Пользовательское поле было успешно добавлено",
    addError: "Ошибка при добавлении поля",
    deleteSuccess: "Пользовательское поле удалено",
    deleteSuccessDescription: "Пользовательское поле было успешно удалено",
    deleteError: "Ошибка при удалении поля",
    confirmDelete: "Вы уверены, что хотите удалить это пользовательское поле?",
    noCustomFields: "Нет пользовательских полей",
    createFirst: "Создайте ваше первое пользовательское поле",
    errorLoading: "Ошибка загрузки пользовательских полей",
    columns: {
      name: "Название",
      type: "Тип",
      value: "Значение",
      actions: "Действия"
    },
    types: {
      text: "Текст",
      number: "Число",
      boolean: "Да/Нет",
      date: "Дата",
      select: "Выпадающий список"
    }
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
    optional: "Необязательно",
    date: "Дата",
    restore: "Восстановить",
    information: "Информация",
    select: "Выбрать",
    enter: "Введите",
    amount: "Сумма",
    users: "Пользователи",
    usersCount: "Количество пользователей",
    settings: "Настройки",
    notification: "Уведомление",
    appName: "Summa",
    refresh: "Обновить",
    yes: "Да",
    no: "Нет",
    success: "Операция успешно выполнена",
    deleteAll: "Удалить всё",
    no_data: "Нет данных",
    notAvailable: "Н/Д",
    active: "Активно",
    inactive: "Неактивно",
    general: "Общие",
    saveFirstToConfigureThis: "Сохраните сервис, чтобы настроить этот раздел",
    filter: "Фильтр",
    filters: "Фильтры",
    apply: "Применить",
    reset: "Сбросить",
    filterOptions: "Параметры фильтра",
    sortBy: "Сортировать по",
    ascending: "По возрастанию",
    descending: "По убыванию",
    applyFilters: "Применить фильтры",
    uploadFile: "Загрузить файл",
    change: "Изменить",
    selectRole: "Выберите роль",
    sortOptions: "Параметры сортировки",
    clearFilters: "Очистить фильтры",
    status: "Статус",
    createdAt: "Дата создания",
    updatedAt: "Дата обновления",
    actions: "Действия"
  },
  cache: {
    title: "Статус кэша",
    total_hits: "Попадания в кэш",
    hits_desc: "Количество запросов, обслуженных из кэша",
    efficiency: "Эффективность кэша",
    efficiency_desc: "Процент запросов, обслуженных из кэша",
    clear: "Очистить кэш",
    cleared: "Кэш очищен",
    cleared_desc: "Кэш был успешно очищен",
    no_data: "Данные о кэше недоступны"
  },
  monitoring: {
    title: "Мониторинг производительности",
    description: "Мониторинг и оптимизация производительности базы данных",
    totalQueries: "Всего запросов",
    avgResponseTime: "Среднее время ответа",
    cacheUsageRatio: "Коэффициент использования кэша",
    potentialCacheHits: "Потенциальные попадания в кэш",
    queryStats: "Статистика запросов",
    poolStatus: "Состояние пула соединений",
    totalConnections: "Всего соединений",
    idleConnections: "Свободные соединения",
    waitingClients: "Ожидающие клиенты",
    query: "Запрос",
    count: "Количество",
    avgTime: "Среднее время",
    ms: "мс",
    percent: "%",
    refreshStats: "Обновить статистику",
    analyzeQuery: "Анализировать запрос",
    queryText: "Текст запроса",
    optimizationTips: "Советы по оптимизации",
    noStats: "Статистика недоступна",
    databasePerformance: "Производительность базы данных",
    cachePerformance: "Производительность кэша",
    queryPerformance: "Производительность запросов",
    connectionStatus: "Состояние соединений",
    
    // Дополнительные переводы
    db_status: "Статус базы данных",
    db_desc: "Текущее соединение с базой данных и информация о производительности",
    connections: "Активные соединения",
    performance: "Метрики производительности",
    avg_time: "Среднее время запроса",
    avg_response: "Среднее время ответа",
    cache_ratio: "Коэффициент кэширования",
    query_desc: "Информация о выполненных запросах к базе данных",
    no_queries: "Статистика запросов недоступна. Включите мониторинг для сбора данных.",
    system_info: "Информация о системе",
    system_desc: "Метрики производительности системы и использования ресурсов",
    metrics: "Метрики",
    response_times: "Время отклика",
    good_performance: "Хорошая производительность, время ответа менее 100мс",
    consider_optimizing: "Рекомендуется оптимизировать медленные запросы",
    total_stats: "Общая статистика",
    queries_executed: "Выполнено запросов",
    unique_queries: "Уникальных запросов",
    toggle: "Включить мониторинг запросов",
    enabled: "Мониторинг включен",
    disabled: "Мониторинг отключен",
    monitoring_on: "Мониторинг производительности теперь активен",
    monitoring_off: "Мониторинг производительности был отключен",
    no_data_desc: "Статистика базы данных недоступна",
    enable_monitoring: "Включите мониторинг для начала сбора метрик"
  },
  analytics: {
    revenue: "Доходы",
    users: "Пользователи",
    services: "Сервисы",
    cashback: "Кэшбэк",
    activity: "Активность",
    userGrowth: "Рост пользователей",
    serviceRevenue: "Доход по сервисам",
    totalRevenue: "Общий доход",
    revenueDistribution: "Распределение доходов",
    clientActivity: "Активность клиентов",
    activeVsInactive: "Активные и неактивные",
    subscriptionCosts: "Стоимость подписок",
    loadingData: "Загрузка данных...",
    loadingRevenue: "Загрузка данных о доходах...",
    loadingDistribution: "Загрузка распределения доходов...",
    loadingUserGrowth: "Загрузка данных о росте пользователей...",
    loadingActivity: "Загрузка данных об активности...",
    loadingCashback: "Загрузка данных о кэшбэке...",
    loadingServices: "Загрузка данных о сервисах...",
    loadingPopularServices: "Загрузка популярных сервисов...",
    loadingServiceRevenue: "Загрузка данных о доходах сервисов...",
    loadingSubscriptionCosts: "Загрузка данных о стоимости подписок...",
    cashbackAnalytics: "Аналитика кэшбэка",
    cashbackAmount: "Сумма кэшбэка по периодам",
    cashbackSummary: "Сводка по кэшбэку",
    totalCashback: "Общий кэшбэк",
    latestCashback: "Последний кэшбэк",
    revenueByService: "Доход по сервисам",
    period: "Период",
    selectPeriod: "Выберите период",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    yearly: "Ежегодно",
    pickDate: "Выберите дату",
    newUsers: "Новые пользователи",
    popularServices: "Популярные сервисы",
    servicesByCount: "Сервисы по количеству подписок",
    avgMinMaxPrices: "Средняя, минимальная и максимальная цены подписок",

  },
  reports: {
    title: "Отчеты",
    generateReport: "Сформировать отчет",
    generateReportDesc: "Создание настраиваемых отчетов на основе ваших данных",
    recentReports: "Недавние отчеты",
    recentReportsDesc: "Ваши недавно сформированные отчеты",
    reportType: "Тип отчета",
    format: "Формат",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    generating: "Формирование отчета...",
    selectReportType: "Выберите тип отчета",
    selectFormat: "Выберите формат",
    viewAllReports: "Просмотреть все отчеты",
    pickDate: "Выберите дату",
    language: "Язык отчета",
    reportGenerated: "Отчет успешно сформирован",
    reportGeneratedDesc: "Ваш отчет был сформирован и готов к скачиванию",
    downloadReport: "Скачать отчет",
    deleteReport: "Удалить отчет",
    noReports: "Отчеты не найдены",
    noReportsDesc: "Вы еще не создали ни одного отчета",
    confirmDelete: "Вы уверены, что хотите удалить этот отчет?",
    reportDeleted: "Отчет успешно удален",
    errorGenerating: "Ошибка при формировании отчета",
    errorDownloading: "Ошибка при скачивании отчета",
    dateCreated: "Дата создания",
    fileSize: "Размер файла",
    reportsList: "Список отчетов",
    
    // Report types
    subscriptionReport: "Отчет по подпискам",
    subscriptionReportDesc: "Подробная информация о подписках и доходах",
    userReport: "Отчет по пользователям",
    userReportDesc: "Статистика роста и активности пользователей",
    servicesReport: "Отчет по сервисам",
    servicesReportDesc: "Использование и популярность сервисов",
    financialReport: "Финансовый отчет",
    financialReportDesc: "Информация о доходах, расходах и прибыли",
    trendsReport: "Отчет по трендам",
    trendsReportDesc: "Тренды и прогнозы на основе исторических данных",
    
    // Report formats
    pdfDocument: "PDF документ",
    excelSpreadsheet: "Excel таблица",
    csvFile: "CSV файл",
    
    // Sample reports
    subscriptionReportSample: "Отчет по подпискам",
    userGrowthReportSample: "Отчет по росту пользователей",
    financialReportSample: "Финансовый отчет Q1",
  },
  layout: {
    adminPanel: "Панель администратора",
    notifications: "Уведомления",
    noNotifications: "Нет новых уведомлений",
    userMenu: "Меню пользователя",
    toggleTheme: "Переключить тему",
    toggleSidebar: "Переключить боковую панель"
  },
  broadcast: {
    title: "Массовые уведомления",
    sendBroadcast: "Отправить уведомление",
    connectedUsers: "Подключенные пользователи",
    newBroadcast: "Новое массовое сообщение",
    newBroadcastDesc: "Создать новое сообщение для отправки всем подключенным пользователям",
    recipientFilter: "Фильтр получателей",
    selectRecipients: "Выбрать получателей",
    allUsers: "Все пользователи",
    adminUsers: "Только администраторы",
    clientUsers: "Только клиенты",
    recipientFilterDesc: "Выберите группу пользователей, которые получат это сообщение",
    messageContent: "Содержание сообщения",
    messageContentPlaceholder: "Введите ваше сообщение здесь...",
    messageContentDesc: "Это сообщение будет отправлено всем выбранным пользователям с подключенными аккаунтами Telegram",
    sendNow: "Отправить сейчас",
    broadcastSent: "Уведомление отправлено",
    broadcastSentDesc: "Ваше сообщение было отправлено {success} пользователям (не удалось: {failed})",
    broadcastFailed: "Не удалось отправить уведомление",
    lastBroadcastResult: "Результат последней рассылки",
    deliveredCount: "Доставлено",
    failedCount: "Не доставлено",
    tips: "Советы по рассылке",
    tip1: "Делайте сообщения краткими и понятными для лучшего восприятия",
    tip2: "Используйте рассылку умеренно, чтобы не перегружать пользователей",
    tip3: "Отправляйте рассылки в рабочее время, когда пользователи с большей вероятностью их увидят",
    tip4: "Включайте четкий призыв к действию, если хотите, чтобы пользователи предприняли конкретные шаги",
    connectedUsersDesc: "Пользователи с привязанными аккаунтами Telegram",
    totalConnected: "Всего подключенных пользователей",
    userId: "ID пользователя",
    telegramChatId: "ID чата Telegram",
    linkedOn: "Привязан",
    messageThis: "Сообщение",
    testMessageToUser: "Это тестовое сообщение для пользователя {userId} из панели администратора.",
    noConnectedUsers: "Нет подключенных пользователей",
    noConnectedUsersDesc: "В настоящее время нет пользователей с привязанными аккаунтами Telegram."
  },
  
  backups: {
    title: "Резервные копии базы данных",
    manageBackups: "Управление резервными копиями базы данных",
    createBackup: "Создать резервную копию",
    restoreBackup: "Восстановить из резервной копии",
    deleteBackup: "Удалить резервную копию",
    backupName: "Имя резервной копии",
    backupSize: "Размер",
    backupDate: "Дата",
    manualBackup: "Ручное резервное копирование",
    scheduledBackup: "Запланированное резервное копирование",
    setupSchedule: "Настроить расписание",
    confirmRestore: "Вы уверены, что хотите восстановить из этой резервной копии? Все текущие данные будут заменены.",
    confirmDelete: "Вы уверены, что хотите удалить эту резервную копию?",
    noBackups: "Резервные копии не найдены",
    backupCreated: "Резервная копия успешно создана",
    backupRestored: "Данные успешно восстановлены из резервной копии",
    backupDeleted: "Резервная копия успешно удалена",
    cleanOldBackups: "Очистить старые резервные копии",
    keepCount: "Количество для сохранения",
    scheduleInterval: "Интервал расписания (часы)",
    
    // Новые поля для расширенных функций
    uploadBackup: "Загрузить резервную копию",
    downloadBackup: "Скачать резервную копию",
    backupTypes: "Типы резервных копий",
    backupFormats: "Форматы резервных копий",
    advancedRestore: "Расширенное восстановление",
    metadataInfo: "Информация о резервной копии",
    
    // Типы бэкапов
    typeManual: "Ручной",
    typeAuto: "Авто",
    typePreRestore: "Пред-восстановление",
    typeImported: "Импортированный",
    typeUnknown: "Неизвестный",
    
    // Поля для загрузки файлов
    selectBackupFile: "Файл резервной копии",
    supportedFormats: "Поддерживаемые форматы: .sql, .dump, .dir, .tar, .zip",
    namePrefix: "Префикс имени",
    uploadButton: "Загрузить",
    uploading: "Загрузка...",
    
    // Поля для расширенного восстановления
    createBackupFirst: "Создать резервную копию перед восстановлением",
    onlyStructure: "Восстановить только структуру (без данных)",
    onlyData: "Восстановить только данные (не меняя структуру)",
    selectSchemas: "Схемы (через запятую)",
    selectTables: "Таблицы (через запятую)",
    restoreFilters: "Фильтры восстановления",
    restoreType: "Тип восстановления",
    schemas: "Схемы",
    tables: "Таблицы",
    advancedOptions: "Расширенные опции",
  },

  auth: {
    login: "Вход",
    register: "Регистрация",
    forgotPassword: "Забыли пароль",
    magicLink: "Магическая ссылка",
    email: "Email",
    password: "Пароль",
    confirmPassword: "Подтверждение пароля",
    name: "Полное имя",
    company: "Название компании",
    phone: "Телефон",
    inn: "ИНН",
    loginAction: "Войти",
    registerAction: "Зарегистрироваться",
    logoutAction: "Выйти",
    dontHaveAccount: "Нет учётной записи?",
    alreadyHaveAccount: "Уже есть учётная запись?",
    emailSent: "Письмо отправлено!",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "Иван Иванов",
    companyPlaceholder: "ООО Компания",
    phonePlaceholder: "+7 (999) 123-4567",
    innPlaceholder: "1234567890",
    sendMagicLink: "Отправить ссылку",
    magicLinkSent: "Магическая ссылка отправлена! Проверьте вашу почту для входа.",
    createAccount: "Создать учётную запись",
    creatingAccount: "Создание учётной записи...",
    signingIn: "Вход в систему...",
    sendingLink: "Отправка ссылки...",
    enterCredentials: "Введите данные для доступа к вашей учётной записи",
    fillDetails: "Заполните данные для создания новой учётной записи",
    enterEmail: "Введите ваш email для получения ссылки для входа",
    rememberPassword: "Вспомнили пароль?",
    welcomeTitle: "Добро пожаловать в Сумма",
    welcomeSubtitle: "Универсальная платформа для эффективного управления SaaS-подписками. Отслеживайте расходы, управляйте лицензиями и оптимизируйте ваш программный комплекс.",
    feature1Title: "Управление подписками",
    feature1Desc: "Отслеживайте все ваши SaaS-подписки в одном месте",
    feature2Title: "Оптимизация расходов",
    feature2Desc: "Контролируйте расходы и оптимизируйте ваши затраты",
    feature3Title: "Аналитика и отчёты",
    feature3Desc: "Получайте ценные данные об использовании SaaS",
    loginSuccess: "Вход выполнен успешно",
    loggedOut: "Выход выполнен",
    loggedOutSuccess: "Вы успешно вышли из системы",
    loginFailed: "Ошибка входа",
    logoutFailed: "Ошибка выхода",
    registrationSuccess: "Регистрация успешна",
    registrationFailed: "Ошибка регистрации",
    accountCreated: "Ваш аккаунт создан",
    magicLinkSent: "Ссылка отправлена",
    magicLinkFailed: "Не удалось отправить ссылку",
    checkEmail: "Проверьте почту для ссылки входа",
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
    reports: "Отчеты",
    backups: "Резервные копии",
    notifications: "Уведомления",
    monitoring: "Мониторинг",
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
    accountSettings: "Связаться с нами",
    viewProfile: "Написать в Telegram",
    messageUs: "Если у вас есть вопрос, напишите нам",
    stats: "Статистика",
    total: "Всего",
    active: "Активные",
    inactive: "Неактивные",
    subscriptionStats: "Статистика подписок",
    userStats: "Статистика пользователей",
    totalUsers: "Всего пользователей",
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
    serviceDescriptionPlaceholder: "Набор инструментов для облачных вычислений, повышения продуктивности и совместной работы...",
    cashbackDescription: "Введите проценты с символом % (например, 5%) или фиксированную сумму (например, 10.00)",
    commissionDescription: "Введите комиссию с символом % (например, 5%) или фиксированную сумму (например, 10.00)",
    serviceIcon: "Иконка сервиса",
    serviceIconDescription: "Загрузите изображение иконки в формате JPG или PNG",
    editServiceDescription: "Редактирование деталей этого сервиса",
    iconSavedInDatabase: "Иконка сохранена в базе данных",
    cashback: "Кэшбэк",
    commission: "Комиссия",
    customFields: "Пользовательские поля",
    customFieldsDesc: "Дополнительные поля для этого сервиса",
    advancedFields: "Расширенные поля",
    editCustomFields: "Редактировать пользовательские поля",
    editCustomFieldsDesc: "Добавить или изменить дополнительные поля для этого сервиса",
    search: "Поиск сервисов...",
    filterDesc: "Фильтрация и сортировка сервисов",
    statusAll: "Все статусы",
    sortOrder: "Порядок сортировки",
    fieldName: "Имя поля",
    fieldNamePlaceholder: "Введите имя поля",
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
    visibleToUsers: "Видимое для пользователей",
    visibleToUsersDesc: "Показывать это поле обычным пользователям",
    addCustomField: "Добавить пользовательское поле",
    requiredField: "Обязательное поле",
    requiredFieldDesc: "Сделать это поле обязательным для заполнения",
    minValue: "Минимальное значение",
    maxValue: "Максимальное значение",
    validationRules: "Правила валидации",
    validationRulesDesc: "Установите правила для обеспечения качества данных",
    minLength: "Минимальная длина",
    maxLength: "Максимальная длина",
    pattern: "Шаблон (Regex)",
    patternDesc: "Регулярное выражение для валидации",
    patternPlaceholder: "например ^[А-Яа-я0-9]+$",
    optionsHint: "Введите варианты ниже",
    advancedOptions: "Расширенные настройки",
    fieldOptions: "Опции поля",
    addCustomFieldsPrompt: "Пользовательских полей еще нет. Нажмите кнопку ниже, чтобы добавить первое пользовательское поле.",
    fieldNumber: "Поле {number}",
    noCustomFields: "Для этого сервиса не найдены пользовательские поля",
    noCustomFieldsAdmin: "Пользовательские поля еще не определены. Нажмите Редактировать, чтобы добавить пользовательские поля.",
    adminOnly: "Только для администратора",
    customFieldsUpdated: "Пользовательские поля обновлены",
    customFieldsUpdatedDesc: "Пользовательские поля были успешно обновлены",
    customFieldsDeleted: "Пользовательские поля удалены",
    customFieldsDeletedDesc: "Все пользовательские поля были успешно удалены",
    confirmDeleteAllFields: "Удалить все пользовательские поля?",
    confirmDeleteAllFieldsDesc: "Это действие удалит все пользовательские поля для этого объекта и не может быть отменено.",
    createService: "Создать сервис",
    updateService: "Обновить сервис",
    confirmDelete: "Вы уверены, что хотите удалить этот сервис?",
    noServices: "Сервисы не найдены",
    serviceDetails: "Детали сервиса",
    serviceCreated: "Сервис успешно создан",
    serviceUpdated: "Сервис успешно обновлен",
    serviceDeleted: "Сервис успешно удален",
    servicesByCount: "Лучшие сервисы по количеству подписок",
    availableServices: "Доступные сервисы",
    availableToSubscribe: "Доступно для подписки",
    totalCashback: "Общий кэшбэк",
    totalCashbackDescription: "Сумма всех кэшбэков от ваших подписок",
    totalCashbackAmount: "Общая сумма кэшбэка",
    totalCashbackAmountDescription: "Общая сумма всех полученных кэшбэков",
    добавитьВПодписки: "Добавить в подписки",
    купить: "Купить",
    оставитьЗаявку: "Оставить заявку",
    купитьСейчас: "Купить сейчас",
    // New fields for service details view
    details: "Детали",
    clients: "Клиенты",
    serviceClients: "Клиенты сервиса",
    clientsDescription: "Список клиентов, использующих этот сервис",
    noClients: "Нет клиентов, использующих этот сервис",
    active: "Активный",
    inactive: "Неактивный",
    // Custom services
    customService: "Кастомный сервис",
    createCustomService: "Создать кастомный сервис",
    myCustomServices: "Мои кастомные сервисы",
    allServices: "Все сервисы",
    ownedBy: "Владелец",
    showCustomServices: "Показать кастомные сервисы",
    hideCustomServices: "Скрыть кастомные сервисы",
  },

  subscriptions: {
    title: "Подписки",
    description: "Управляйте подписками на различные сервисы",
    manageSubscriptions: "Управление всеми вашими активными подписками на сервисы",
    addSubscription: "Добавить подписку",
    editSubscription: "Редактировать подписку",
    editTitle: "Редактирование подписки",
    editDescription: "Обновление информации о подписке",
    subscriptionTitle: "Название подписки", 
    showing: "Показано",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    service: "Сервис",
    selectService: "Выберите сервис",
    selectedService: "Выбранный сервис",
    noServiceSelected: "Сервис не выбран",
    enterServiceName: "Введите название сервиса",
    customServiceName: "Свой сервис",
    domain: "Домен",
    loginId: "Логин",
    serviceName: "Название сервиса",
    otherCustom: "Другое (Свой)",
    renewalAmount: "Сумма продления",
    enterTitle: "Введите название подписки",
    enterDomain: "Введите домен",
    login: "Логин",
    enterLogin: "Введите логин",
    enterAmount: "Введите сумму",
    enterUsersCount: "Введите количество пользователей",
    plan: "Тариф",
    selectPlan: "Выберите тариф",
    paymentPeriod: "Период оплаты",
    monthly: "Ежемесячно",
    monthlyNew: "Ежемесячно",
    longTerm: "Длительный срок",
    topUp: "Пополнение баланса",
    other: "Другое",
    quarterly: "Ежеквартально",
    yearly: "Ежегодно",
    paymentAmount: "Сумма оплаты",
    paidUntil: "Оплачено до",
    licensesCount: "Количество лицензий",
    enterLicensesCount: "Введите количество лицензий",
    usersCount: "Количество пользователей",
    customFields: "Пользовательские поля",
    advancedFields: "Расширенные поля",
    showCustomFields: "Показать дополнительные поля",
    cashback: "Кэшбэк",
    status: "Статус",
    statusActive: "Активна",
    statusPending: "Заканчивается",
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
    active: "Активна",
    activeUntil: "Активна до",
    nextPayment: "Следующий платеж",
    allSubscriptions: "Все подписки",
    allSubscriptionsDescription: "Управление всеми подписками клиентов",
    searchPlaceholder: "Поиск по сервису, пользователю, домену...",
    searchService: "Поиск по сервису",
    searchUser: "Поиск по пользователю",
    searchDomain: "Поиск по домену",
    addButton: "Добавить подписку",
    addTitle: "Добавить подписку",
    addDescription: "Создать новую подписку",
    optional: "Опционально",
    selectPeriod: "Выберите период",
    amount: "Сумма",
    selectStatus: "Выберите статус",
    service_name: "Название сервиса",
    enter_service_name: "Введите название сервиса",
    custom: "Свой",
    periods: {
      monthly: "Ежемесячно",
      quarterly: "Длительный срок",
      yearly: "Пополнение баланса",
      other: "Другое"
    },
    periodValues: {
      monthly: "Ежемесячно",
      quarterly: "Длительный срок",
      yearly: "Пополнение баланса",
      other: "Другое"
    },
    statuses: {
      active: "Активна",
      pending: "Заканчивается",
      expired: "Истекла",
      canceled: "Отменена"
    },
    noSubscriptionsFound: "Подписки не найдены",
    adjustFilters: "Попробуйте изменить параметры фильтрации",
    viewDetails: "Просмотр деталей",
    viewUser: "Просмотр пользователя",
    errorLoadingSubscriptions: "Ошибка загрузки подписок",
    user: "Пользователь",
    select_user: "Выберите пользователя",
    filterDescription: "Фильтруйте и сортируйте список подписок",
    searchHelp: "Поиск по сервисам, пользователям и доменам",
    columnVisibility: "Отображение столбцов",
    columnVisibilityDescription: "Выберите столбцы для отображения в таблице",
    searchCompany: "Поиск по компании",
    priceMin: "Мин. цена",
    priceMax: "Макс. цена",
    startDateFrom: "Дата начала (с)",
    startDateTo: "Дата начала (по)",
    endDateFrom: "Дата окончания (с)",
    endDateTo: "Дата окончания (по)",
    paidUntilFrom: "Оплачено до (с)",
    paidUntilTo: "Оплачено до (по)",
    resetColumns: "Сбросить столбцы",
    resetFilters: "Сбросить фильтры",
    sortOptionsDescription: "Выберите поле и порядок сортировки",
    filters: {
      selectStatus: "Выберите статус",
      statusAll: "Все",
      statusActive: "Активные",
      statusPending: "Заканчивается",
      statusExpired: "Истекшие",
      statusCanceled: "Отмененные",
      periodAll: "Все периоды",
      selectSortField: "Выберите поле для сортировки",
      sortService: "Сервису",
      sortUser: "Пользователю",
      sortStatus: "Статусу",
      sortPrice: "Цене",
      sortPeriod: "Периоду",
      sortTitle: "Названию",
      sortStartDate: "Дате начала", 
      sortEndDate: "Дате окончания",
      sortPaidUntil: "Дате оплаты до",
      sortDomain: "Домену",
      sortCreatedAt: "Дате создания",
      sortOrder: "Порядок сортировки",
      selectSortOrder: "Выберите порядок сортировки",
      sortOptionsDescription: "Выберите поле и порядок сортировки",
      priceMin: "Мин. цена",
      priceMax: "Макс. цена",
      startDateFrom: "Дата начала (с)",
      startDateTo: "Дата начала (по)",
      endDateFrom: "Дата окончания (с)",
      endDateTo: "Дата окончания (по)",
      paidUntilFrom: "Оплачено до (с)",
      paidUntilTo: "Оплачено до (по)"
    },
    columns: {
      service: "Сервис",
      user: "Пользователь",
      status: "Статус",
      price: "Цена",
      period: "Период",
      createdAt: "Дата создания",
      actions: "Действия",
      startDate: "Дата начала",
      endDate: "Дата окончания",
      amount: "Сумма"
    },
    statusValues: {
      active: "Активна",
      pending: "Ожидание",
      expired: "Истекла",
      canceled: "Отменена"
    },

    unknownService: "Неизвестный сервис",
    errorLoading: "Ошибка загрузки подписок",
  },

  users: {
    title: "Управление пользователями",
    manageUsers: "Управление учетными записями пользователей и правами доступа",
    addUser: "Добавить пользователя",
    editUser: "Редактировать пользователя",
    manageSubscriptions: "Управление подписками",
    manageSubscriptionsDescription: "Управление подписками пользователя",
    manageCustomFields: "Управление пользовательскими полями",
    manageCustomFieldsDescription: "Управление пользовательскими полями для этого пользователя",
    actions: "Действия",
    edit: "Редактировать",
    delete: "Удалить",
    userEmail: "Email",
    userName: "Имя",
    userCompany: "Компания",
    userPhone: "Телефон",
    userRole: "Роль",
    roleAdmin: "Администратор",
    roleClient: "Клиент",
    searchCompany: "Поиск по компании",
    status: "Статус",
    statusActive: "Активен",
    statusInactive: "Неактивен",
    createUser: "Создать пользователя",
    updateUser: "Обновить пользователя",
    activeStatus: "Статус активности",
    activeStatusDescription: "Пользователь сможет войти в систему, если активен",
    password: "Пароль",
    newPassword: "Новый пароль (оставьте пустым для сохранения текущего)",
    emailPlaceholder: "Введите адрес электронной почты",
    confirmDelete: "Вы уверены, что хотите удалить этого пользователя?",
    noUsers: "Пользователи не найдены",
    userDetails: "Детали пользователя",
    userDetailsDescription: "Информация о пользователе",
    viewFullProfile: "Полный профиль",
    errorLoadingUser: "Ошибка загрузки пользователя",
    userCreated: "Пользователь успешно создан",
    userUpdated: "Пользователь успешно обновлен",
    userDeleted: "Пользователь успешно удален",
    showing: "Показано {current} из {total} пользователей",
    searchPlaceholder: "Поиск пользователей...",
    errorLoading: "Ошибка загрузки пользователей. Пожалуйста, попробуйте снова.",
    noUsersFound: "Пользователи не найдены.",
    emailPlaceholder: "user@example.com",
    namePlaceholder: "Иван Иванов",
    companyPlaceholder: "ООО Компания",
    phonePlaceholder: "+7 (999) 123-45-67",
    activeStatus: "Активный статус",
    activeStatusDescription: "Пользователь сможет войти в систему, если активен",
    newPassword: "Новый пароль (оставьте пустым, чтобы сохранить текущий)",
    password: "Пароль",
    filters: {
      status: "Статус",
      selectStatus: "Выберите статус",
      statusAll: "Все",
      statusActive: "Активные",
      statusInactive: "Неактивные",
      sortBy: "Сортировать по",
      selectSortField: "Выберите поле для сортировки",
      sortOrder: "Порядок сортировки",
      selectSortOrder: "Выберите порядок сортировки",
      ascending: "По возрастанию",
      descending: "По убыванию",
      company: "Компания",
      enterCompany: "Введите название компании",
      sortName: "Имени",
      sortEmail: "Email",
      sortCompany: "Компании",
      sortCreatedAt: "Дате создания"
    },
    columns: {
      name: "Имя",
      email: "Email",
      company: "Компания",
      status: "Статус",
      registration_date: "Дата регистрации",
      subscriptions: "Подписки",
      cashback: "Баланс кэшбэка",
      actions: "Действия"
    }
  },

  profile: {
    title: "Профиль",
    personalInfo: "Личная информация",
    accountSettings: "Настройки аккаунта",
    updateProfile: "Обновить профиль",
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmNewPassword: "Подтвердить новый пароль",
    profileUpdated: "Профиль успешно обновлен",
    profileUpdatedSuccess: "Информация профиля сохранена",
    passwordUpdated: "Пароль успешно обновлен",
    role: "Роль",
    accountStatus: "Статус аккаунта",
    active: "Активен",
    memberSince: "Участник с",
  },
  
  telegram: {
    title: "Подключение Telegram",
    description: "Управление интеграцией с Telegram",
    connect: "Подключить Telegram",
    connected: "Подключено к Telegram",
    notConnected: "Не подключено к Telegram",
    generateLink: "Сгенерировать код подключения",
    linkInstructions: "Чтобы подключить Telegram, выполните следующие шаги:",
    openBot: "Откройте Telegram и найдите нашего бота",
    sendCommand: "Отправьте боту команду /link {code}",
    afterLink: "После подключения вы будете получать уведомления и обновления через Telegram",
    receiveNotifications: "Вы будете получать уведомления о ваших подписках и обновлениях",
    sendTestNotification: "Отправить тестовое уведомление",
    testNotificationSent: "Тестовое уведомление успешно отправлено",
    disconnect: "Отключить Telegram",
    disconnected: "Telegram успешно отключен",
    confirmDisconnect: "Вы уверены, что хотите отключить ваш аккаунт Telegram?",
    disconnectWarning: "Вы больше не будете получать уведомления или обновления через Telegram.",
    commandCopied: "Команда скопирована в буфер обмена",
    connectViaLink: "Подключить через Telegram",
    orManualSteps: "Или выполните эти шаги вручную:",
  },

  messages: {
    invalidCredentials: "Неверный email или пароль",
    requiredField: "Это поле обязательно для заполнения",
    invalidEmail: "Пожалуйста, введите корректный email адрес",
    passwordTooShort: "Пароль должен содержать не менее 8 символов",
    passwordsDoNotMatch: "Пароли не совпадают",
    unauthorized: "Неавторизованный доступ",
    forbidden: "У вас нет разрешения на доступ к этому ресурсу",
    notFound: "Запрашиваемый ресурс не найден",
    serverError: "На сервере произошла ошибка",
    welcomeBack: "С возвращением, {name}!",
    goodbye: "Вы вышли из системы",
    invalidToken: "Токен недействителен или истек",
    expiredToken: "Срок действия токена истек",
    userNotFound: "Пользователь не найден",
    loginFailed: "Ошибка входа",
    emailAlreadyExists: "Пользователь с таким email уже существует",
    invalidLink: "Ссылка недействительна или просрочена",
    linkExpired: "Срок действия ссылки истек",
    somethingWentWrong: "Что-то пошло не так. Пожалуйста, попробуйте позже.",
  },
};