import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@material-ui/core";
import makeStyles from "@material-ui/styles/makeStyles";
import styles from "./styles.css";

const OptionsBox = ({ title, action, children, to }) => {
  const css = makeStyles(styles)();

  return (
    <Card className={css.card} elevation={3}>
      <CardHeader
        action={action}
        title={
          typeof to !== "undefined" ? (
            <Link to={to} className={css.cardLink}>
              {title}
            </Link>
          ) : (
            title
          )
        }
        className={css.title}
      />
      <CardContent className={css.content}>{children}</CardContent>
    </Card>
  );
};

OptionsBox.propTypes = {
  title: PropTypes.string,
  to: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node
};

export default OptionsBox;