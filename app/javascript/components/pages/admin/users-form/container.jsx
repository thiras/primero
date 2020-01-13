import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import * as yup from "yup";
import { push } from "connected-react-router";
import { useLocation, useParams } from "react-router-dom";

import { useI18n } from "../../../i18n";
import Form, { FormAction, whichFormMode } from "../../../form";
import { PageHeading, PageContent } from "../../../page";
import { LoadingIndicator } from "../../../loading-indicator";
import NAMESPACE from "../namespace";

import form from "./form";
import { fetchUser, clearSelectedUser, saveUser } from "./action-creators";
import { getUser } from "./selectors";

const Container = ({ mode }) => {
  const formMode = whichFormMode(mode);
  const i18n = useI18n();
  const formRef = useRef();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { id } = useParams();
  const user = useSelector(state => getUser(state));
  const isEditOrShow = formMode.get("isEdit") || formMode.get("isShow");

  const validationSchema = yup.object().shape({
    agency_id: yup.string().required(),
    email: yup.string().required(),
    full_name: yup.string().required(),
    module_unique_ids: yup.array().required(),
    role_unique_id: yup.string().required(),
    user_group_unique_ids: yup.array().required(),
    user_name: yup.string().required(),
    ...(formMode.get("isNew") && { password: yup.string().required() }),
    ...(formMode.get("isNew") && {
      password_confirmation: yup
        .string()
        .oneOf(
          [yup.ref("password"), null],
          i18n.t("errors.models.user.password_mismatch")
        )
        .required()
    })
  });

  const handleSubmit = data => {
    dispatch(
      saveUser({
        id,
        saveMethod: formMode.get("isEdit") ? "update" : "new",
        body: { data },
        message: i18n.t(
          `user.messages.${formMode.get("isEdit") ? "updated" : "created"}`
        )
      })
    );
  };

  const bindFormSubmit = () => {
    formRef.current.submitForm();
  };

  const handleEdit = () => {
    dispatch(push(`${pathname}/edit`));
  };

  const handleCancel = () => {
    dispatch(push("/admin/users"));
  };

  useEffect(() => {
    if (isEditOrShow) {
      dispatch(fetchUser(id));
    }

    return () => {
      if (isEditOrShow) {
        dispatch(clearSelectedUser());
      }
    };
  }, [id]);

  const saveButton = (formMode.get("isEdit") || formMode.get("isNew")) && (
    <>
      <FormAction
        cancel
        actionHandler={handleCancel}
        text={i18n.t("buttons.cancel")}
      />
      <FormAction
        actionHandler={bindFormSubmit}
        text={i18n.t("buttons.save")}
      />
    </>
  );

  const editButton = formMode.get("isShow") && (
    <FormAction actionHandler={handleEdit} text={i18n.t("buttons.edit")} />
  );

  const pageHeading = user?.size
    ? `${i18n.t("users.label")} ${user.get("full_name")}`
    : i18n.t("users.label");

  return (
    <LoadingIndicator
      hasData={formMode.get("isNew") || user?.size > 0}
      type={NAMESPACE}
    >
      <PageHeading title={pageHeading}>
        {editButton}
        {saveButton}
      </PageHeading>
      <PageContent>
        <Form
          useCancelPrompt
          mode={mode}
          formSections={form(i18n)}
          onSubmit={handleSubmit}
          ref={formRef}
          validations={validationSchema}
          initialValues={user.toJS()}
        />
      </PageContent>
    </LoadingIndicator>
  );
};

Container.displayName = "UsersForm";

Container.propTypes = {
  mode: PropTypes.string.isRequired
};

export default Container;
