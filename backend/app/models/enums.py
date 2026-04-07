import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    nurse = "nurse"
    receptionist = "receptionist"


class Sex(str, enum.Enum):
    male = "male"
    female = "female"


class MaritalStatus(str, enum.Enum):
    single = "single"
    married = "married"
    divorced = "divorced"
    widowed = "widowed"


class SmokingStatus(str, enum.Enum):
    never = "never"
    former = "former"
    current = "current"


class ChestPainType(str, enum.Enum):
    none = "none"
    typical = "typical"
    atypical = "atypical"
    non_cardiac = "non_cardiac"


class PalpitationFrequency(str, enum.Enum):
    none = "none"
    occasional = "occasional"
    frequent = "frequent"
    constant = "constant"


class SyncopeType(str, enum.Enum):
    none = "none"
    pre_syncope = "pre_syncope"
    syncope = "syncope"


class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"


class PrescriptionStatus(str, enum.Enum):
    draft = "draft"
    finalized = "finalized"
    voided = "voided"


class AppointmentType(str, enum.Enum):
    new = "new"
    follow_up = "follow_up"
    procedure = "procedure"
    telemedicine = "telemedicine"


class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    arrived = "arrived"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class AuditAction(str, enum.Enum):
    create = "create"
    update = "update"
    delete = "delete"
    login = "login"
    logout = "logout"
    export = "export"
    restore = "restore"


class ImageType(str, enum.Enum):
    xray = "xray"
    echo = "echo"
    ecg = "ecg"
    ct = "ct"
    mri = "mri"
    other = "other"
