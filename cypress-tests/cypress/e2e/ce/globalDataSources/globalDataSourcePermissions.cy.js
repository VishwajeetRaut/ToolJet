import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    fillDataSourceTextField,
    selectAndAddDataSource,
    fillConnectionForm,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import {
    closeDSModal,
    deleteDatasource,
    addQuery,
    verifyValueOnInspector,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { addNewUserMW } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    pinInspector,
    verifyModal,
} from "Support/utils/common";

const data = {};
data.firstName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase();
data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.dsName2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;

describe("Global Datasource Manager", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.viewport(1200, 1300);
    });
    before(() => {
        cy.defaultWorkspaceLogin();
        cy.apiCreateApp(data.appName);
        addNewUserMW(data.firstName, data.email);
        logout();
    });

    it("Should verify the global data source manager UI", () => {
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
            "have.text",
            "Data sources"
        );
        cy.get(dataSourceSelector.allDatasourceLabelAndCount).verifyVisibleElement(
            "have.text",
            dataSourceText.allDataSources
        );
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Data sources");
        });

        cy.get(dataSourceSelector.databaseLabelAndCount).verifyVisibleElement(
            "have.text",
            dataSourceText.allDatabase
        );
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Databases"
        );
        cy.get(dataSourceSelector.querySearchBar)
            .invoke("attr", "placeholder")
            .should("eq", "Search  data sources");

        cy.get(dataSourceSelector.apiLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.allApis)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " APIs"
        );

        cy.get(dataSourceSelector.cloudStorageLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.allCloudStorage)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Cloud Storages"
        );

        cy.get(dataSourceSelector.pluginsLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.pluginsLabelAndCount)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Plugins"
        );

        cy.get('[data-cy="added-ds-label"]').should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Data sources added");
        });
        cy.get(dataSourceSelector.addedDsSearchIcon).should("be.visible").click();
        cy.get(dataSourceSelector.AddedDsSearchBar)
            .invoke("attr", "placeholder")
            .should("eq", "Search for Data sources");

        selectAndAddDataSource(
            "databases",
            dataSourceText.postgreSQL,
            data.dsName1
        );
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.dsName1}-postgresql1`
        );

        cy.get(dataSourceSelector.databaseLabelAndCount).click();

        cy.get(commonSelectors.modalComponent).should("be.visible");
        cy.get(dataSourceSelector.unSavedModalTitle).verifyVisibleElement(
            "have.text",
            dataSourceText.unSavedModalTitle
        );
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
        cy.get(commonSelectors.cancelButton)
            .should("be.visible")
            .and("have.text", commonText.saveChangesButton);
        cy.get(commonSelectors.yesButton).verifyVisibleElement(
            "have.text",
            "Discard"
        );

        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(dataSourceSelector.buttonSave).should("be.enabled");

        cy.get(dataSourceSelector.databaseLabelAndCount).click();
        cy.get(commonSelectors.yesButton).click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Databases"
        );
        cy.get(`[data-cy="cypress-${data.dsName1}-postgresql-button"]`).click();
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.dsName1}-postgresql1`
        );
        cy.get(commonSelectors.dashboardIcon).click();
        cy.get(commonSelectors.yesButton).click();

        cy.get(commonSelectors.appCreateButton).should("be.visible");
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(`[data-cy="cypress-${data.dsName1}-postgresql-button"]`).click();
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.dsName1}-postgresql1`
        );
        cy.get(commonSelectors.dashboardIcon).click();
        cy.get(commonSelectors.cancelButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dataSourceText.toastDSSaved
        );

        cy.get(
            `[data-cy="cypress-${data.dsName1}-postgresql1-button"]`
        ).verifyVisibleElement("have.text", `cypress-${data.dsName1}-postgresql1`);

        deleteDatasource(`cypress-${data.dsName1}-postgresql1`);
    });

    it("Should verify the Datasource connection and query creation using global data source", () => {
        selectAndAddDataSource(
            "databases",
            dataSourceText.postgreSQL,
            data.dsName1
        );

        cy.intercept("GET", "api/v2/data_sources").as("datasource");
        fillConnectionForm(
            {
                Host: Cypress.env("pg_host"),
                Port: "5432",
                "Database Name": Cypress.env("pg_user"),
                Username: Cypress.env("pg_user"),
                Password: Cypress.env("pg_password"),
            },
            ".form-switch"
        );
        cy.wait("@datasource");

        cy.openApp();
        pinInspector();

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.dsName1}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        verifyValueOnInspector("table_preview", "7 items ");
        cy.get('[data-cy="show-ds-popover-button"]').click();

        cy.get(".p-2 > .tj-base-btn")
            .should("be.visible")
            .and("have.text", "+ Add new Data source");
        cy.get(".p-2 > .tj-base-btn").click();
        cy.get('[data-cy="databases-datasource-button"]').should("be.visible");

        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            `cypress-${data.dsName2}-postgresql`,
            "postgresql",
            [
                { key: "host", value: Cypress.env("pg_host") },
                { key: "port", value: 5432 },
                { key: "database", value: Cypress.env("pg_user") },
                { key: "username", value: Cypress.env("pg_user") },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );

        navigateToManageGroups();
        cy.get(groupsSelector.appSearchBox).click();
        cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
        cy.get(groupsSelector.selectAddButton).click();
        cy.contains("tr", data.appName)
            .parent()
            .within(() => {
                cy.get("td input").eq(1).check();
            });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "App permissions updated"
        );
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).then(($el) => {
            if (!$el.is(":checked")) {
                cy.get(groupsSelector.appsCreateCheck).check();
            }
        });
    });
    it("Should validate the user's global data source permissions on apps created by admin", () => {
        logout();
        cy.apiLogin(data.email, "password");
        cy.visit("/my-workspace");

        cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

        navigateToAppEditor(data.appName);

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        pinInspector();

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        verifyValueOnInspector("table_preview", "7 items ");

        addQuery(
            "student_data",
            `SELECT * FROM student_data;`,
            `cypress-${data.dsName2}-postgresql`
        );

        cy.get('[data-cy="list-query-student_data"]').verifyVisibleElement(
            "have.text",
            "student_data "
        );
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        verifyValueOnInspector("student_data", "4 items ");
    });
    it("Should verify the query creation and scope changing functionality.", () => {
        data.appName = `${fake.companyName}-App`;
        logout();
        cy.apiLogin(data.email, "password");
        cy.apiCreateApp(data.appName);
        cy.openApp();

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.dsName1}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        pinInspector();

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        verifyValueOnInspector("table_preview", "7 items ");
    });
});
