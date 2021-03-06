import * as constants from "./constants";

describe("<ReportsForm /> - Constants", () => {
  it("should have known constant", () => {
    const clone = { ...constants };

    [
      "AGGREGATE_BY_FIELD",
      "ALLOWED_FIELD_TYPES",
      "CONSTRAINTS",
      "DATE_CONSTRAINTS",
      "DEFAULT_FILTERS",
      "DESCRIPTION_FIELD",
      "DISAGGREGATE_BY_FIELD",
      "FILTERS_FIELD",
      "GROUP_AGES_FIELD",
      "GROUP_DATES_BY_FIELD",
      "IS_GRAPH_FIELD",
      "DISABLED_FIELD",
      "MODULES_FIELD",
      "NAME",
      "NAME_FIELD",
      "NOT_NULL",
      "RECORD_TYPE_FIELD",
      "REPORTABLE_TYPES",
      "REPORT_FIELD_TYPES"
    ].forEach(property => {
      expect(clone).to.have.property(property);
      delete clone[property];
    });

    expect(clone).to.be.empty;
  });
});
