// Time (ms) when fetch request will timeout
export const FETCH_TIMEOUT = 30000;

// IndexedDB database name
export const DATABASE_NAME = "primero";

// IndexedDB database collections
export const DB = {
  USER: "user",
  FIELDS: "fields",
  FORMS: "forms",
  OPTIONS: "options",
  RECORDS: "records",
  SYSTEM_SETTINGS: "system_settings"
};

// Time (ms) when the idle dialog will activate when a user is inactive
export const IDLE_TIMEOUT = 15 * 1000 * 60;

// Time (ms) user has to respond to idle dialog before logged out
export const IDLE_LOGOUT_TIMEOUT = 5 * 1000 * 60;

// Time (ms) how often the backend is pinged to refresh the user's token
export const TOKEN_REFRESH_INTERVAL = 30 * 1000 * 60;

// Type of records available singular (key): plural (value)
export const RECORD_TYPES = {
  cases: "case",
  tracing_requests: "tracing_request",
  incidents: "incident"
};

// Max Age allowed in age ranges
export const AGE_MAX = 999;

export const MODULES = Object.freeze({
  CP: "primeromodule-cp",
  GBV: "primeromodule-gbv"
});

export const MODULE_TYPE_FIELD = "module_id";

export const USER_NAME_FIELD = "user_name";

export const CONSENT_GIVEN_FIELD_BY_MODULE = Object.freeze({
  [MODULES.CP]: "consent_for_services",
  [MODULES.GBV]: "disclosure_other_orgs"
});

export const RECORD_PATH = {
  cases: "cases",
  tracing_requests: "tracing_requests",
  incidents: "incidents",
  tasks: "tasks"
};

export const RECORD_OWNER = "record_owner";

export const TRANSFERS_ASSIGNMENTS = "transfers_assignments";

export const REFERRAL = "referral";

export const TRANSITION_TYPE = [TRANSFERS_ASSIGNMENTS, REFERRAL];

export const ROUTES = {
  account: "/account",
  cases: "/cases",
  dashboard: "/dashboard",
  exports: "/exports",
  incidents: "/incidents",
  login: "/login",
  logout: "/logout",
  matches: "/matches",
  not_authorized: "/not-authorized",
  reports: "/reports",
  support: "/support",
  tasks: "/tasks",
  tracing_requests: "/tracing_requests"
};

export const PERMITTED_URL = [
  ROUTES.account,
  ROUTES.dashboard,
  ROUTES.login,
  ROUTES.logout,
  ROUTES.not_authorized,
  ROUTES.support
];

export const DATE_FORMAT = "dd-MMM-yyyy";

export const DATE_TIME_FORMAT = "dd-MMM-yyyy HH:mm";

export const MODES = {
  edit: "edit",
  new: "new",
  show: "show"
};