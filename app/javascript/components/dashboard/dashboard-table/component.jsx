import { useDispatch } from "react-redux";
import MUIDataTable from "mui-datatables";
import PropTypes from "prop-types";
import React from "react";
import { push } from "connected-react-router";
import { MuiThemeProvider } from "@material-ui/core/styles";

import { dataToJS } from "../../../libs";
import { ROUTES } from "../../../config";
import { buildFilter } from "../utils";

import dashboardTableTheme from "./theme";

const DashboardTable = ({ columns, data, query, title }) => {
  const dispatch = useDispatch();
  const options = {
    responsive: "vertical",
    fixedHeader: false,
    elevation: 0,
    filter: false,
    download: false,
    search: false,
    print: false,
    viewColumns: false,
    serverSide: true,
    setTableProps: () => ({ "aria-label": title }),
    customToolbar: () => null,
    customToolbarSelect: () => null,
    onTableChange: () => null,
    pagination: false,
    selectableRows: "none",
    sort: false,
    onCellClick: (colData, cellMeta) => {
      const { colIndex, rowIndex } = cellMeta;
      const columnName = columns[colIndex].name;

      if (typeof query[rowIndex] !== "undefined") {
        const clickedCellQuery = query[rowIndex][columnName];

        if (Array.isArray(clickedCellQuery)) {
          dispatch(
            push({
              pathname: ROUTES.cases,
              search: buildFilter(clickedCellQuery, true)
            })
          );
        }
      }
    }
  };

  const tableOptions = {
    columns,
    options,
    data: dataToJS(data),
    title
  };

  return (
    <MuiThemeProvider theme={dashboardTableTheme}>
      <MUIDataTable {...tableOptions} />
    </MuiThemeProvider>
  );
};

DashboardTable.displayName = "DashboardTable";

DashboardTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  query: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  title: PropTypes.string
};

export default DashboardTable;
