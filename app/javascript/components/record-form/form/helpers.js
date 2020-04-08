import find from "lodash/find";
import { fromJS } from "immutable";

import { CODE_FIELD, NAME_FIELD, UNIQUE_ID_FIELD } from "../../../config";

export const appendDisabledAgency = (agencies, agencyUniqueId) =>
  agencyUniqueId &&
  !agencies.map(agency => agency.get("unique_id")).includes(agencyUniqueId)
    ? agencies.push(
        fromJS({
          unique_id: agencyUniqueId,
          name: agencyUniqueId,
          isDisabled: true
        })
      )
    : agencies;

export const appendDisabledUser = (users, userName) =>
  userName && !users.map(user => user.get("user_name")).includes(userName)
    ? users.push(fromJS({ user_name: userName, isDisabled: true }))
    : users;

export const getConnectedFields = index => {
  const connectedFields = {
    service: "service_type",
    agency: "service_implementing_agency",
    location: "service_delivery_location",
    user: "service_implementing_agency_individual"
  };

  if (index >= 0) {
    return {
      service: `services_section[${index}]${connectedFields.service}`,
      agency: `services_section[${index}]${connectedFields.agency}`,
      location: `services_section[${index}]${connectedFields.location}`,
      user: `services_section[${index}]${connectedFields.user}`
    };
  }

  return connectedFields;
};

export const handleChangeOnServiceUser = ({
  agencies,
  data,
  form,
  index,
  referralUsers,
  reportingLocations,
  setFilterState
}) => {
  const selectedUser = referralUsers.find(
    user => user.get("user_name") === data?.value
  );

  if (selectedUser?.size) {
    const userAgency = selectedUser.get("agency");
    const userLocation = selectedUser.get("location");

    if (agencies.find(current => current.get("unique_id") === userAgency)) {
      form.setFieldValue(getConnectedFields(index).agency, userAgency, false);
    }

    if (
      reportingLocations.find(current => current.get("code") === userLocation)
    ) {
      form.setFieldValue(
        getConnectedFields(index).location,
        userLocation,
        false
      );
    }
  }

  setFilterState({ filtersChanged: true, userIsSelected: true });
};

export const translatedText = (displayText, i18n) => {
  return displayText instanceof Object
    ? displayText?.[i18n.locale]
    : displayText;
};

export const findOptionDisplayText = ({
  agencies,
  customLookups,
  i18n,
  option,
  options,
  value
}) => {
  const foundOptions = find(options, { id: value }) || {};
  let optionValue = [];

  if (Object.keys(foundOptions).length && !customLookups.includes(option)) {
    optionValue = translatedText(foundOptions.display_text, i18n);
  } else if (option === "Agency") {
    optionValue = value
      ? agencies.find(a => a.get("id") === value)?.get("name")
      : value;
  } else {
    optionValue = "";
  }

  return optionValue;
};

export const buildCustomLookupsConfig = ({
  agencies,
  filterState,
  locations,
  referralUsers,
  reportingLocations,
  value
}) => ({
  Location: {
    fieldLabel: NAME_FIELD,
    fieldValue: CODE_FIELD,
    options: locations
  },
  Agency: {
    fieldLabel: NAME_FIELD,
    fieldValue: UNIQUE_ID_FIELD,
    options: !filterState?.filtersChanged
      ? appendDisabledAgency(agencies, value)
      : agencies
  },
  ReportingLocation: {
    fieldLabel: NAME_FIELD,
    fieldValue: CODE_FIELD,
    options: reportingLocations
  },
  User: {
    fieldLabel: "user_name",
    fieldValue: "user_name",
    options: !filterState?.filtersChanged
      ? appendDisabledUser(referralUsers, value)
      : referralUsers
  }
});
