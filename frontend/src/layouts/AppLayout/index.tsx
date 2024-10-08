import React from 'react';
import Avatar from 'react-avatar';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import { Mode } from '@cloudscape-design/global-styles';

import {
    AppLayout as GenericAppLayout,
    AppLayoutProps as GenericAppLayoutProps,
    BreadcrumbGroup,
    HelpPanel,
    Notifications,
    SideNavigation,
    Tabs,
    TopNavigation,
} from 'components';

import { DISCORD_URL, DOCS_URL } from 'consts';
import { useAppDispatch, useAppSelector } from 'hooks';
import { goToUrl } from 'libs';
import { ROUTES } from 'routes';

import {
    closeToolsPanel,
    openTutorialPanel,
    selectBreadcrumbs,
    selectHelpPanelContent,
    selectSystemMode,
    selectToolsPanelState,
    selectUserName,
    setSystemMode,
    setToolsTab,
} from 'App/slice';

import { AnnotationContext } from './AnnotationContext';
import { useProjectDropdown, useSideNavigation } from './hooks';
import { TallyComponent } from './Tally';
import { TutorialPanel } from './TutorialPanel';

import { ToolsTabs } from 'App/types';

import { ReactComponent as DarkThemeIcon } from 'assets/icons/dark-theme.svg';
import { ReactComponent as LightThemeIcon } from 'assets/icons/light-theme.svg';
import { ReactComponent as SystemThemeIcon } from 'assets/icons/system-theme.svg';
import logo from 'assets/images/logo.svg';
import styles from './index.module.scss';

type PortalProps = { children: React.ReactNode };

const HeaderPortal = ({ children }: PortalProps) => {
    const domNode = document.querySelector('#header');
    if (domNode) return createPortal(children, domNode);
    return null;
};

const THEME_ICON_MAP: Record<Mode | 'system', React.ReactElement> = {
    [Mode.Dark]: DarkThemeIcon,
    [Mode.Light]: LightThemeIcon,
    system: SystemThemeIcon,
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const userName = useAppSelector(selectUserName) ?? '';
    const systemMode = useAppSelector(selectSystemMode) ?? '';
    const breadcrumbs = useAppSelector(selectBreadcrumbs);
    const { isOpen: toolsIsOpen, tab: toolsActiveTab } = useAppSelector(selectToolsPanelState);
    const helpPanelContent = useAppSelector(selectHelpPanelContent);
    const dispatch = useAppDispatch();
    const { projectsDropdownList, selectedProject, onFollowProject, isAvailableProjectDropdown } = useProjectDropdown();
    const { navLinks, activeHref } = useSideNavigation();

    const onFollowHandler: SideNavigationProps['onFollow'] = (event) => {
        event.preventDefault();
        navigate(event.detail.href);
    };

    const renderBreadcrumbs = () => {
        if (breadcrumbs) return <BreadcrumbGroup items={breadcrumbs} onFollow={onFollowHandler} />;
    };

    const i18nStrings = {
        overflowMenuTriggerText: '',
        overflowMenuTitleText: '',
        overflowMenuBackIconAriaLabel: '',
        overflowMenuDismissIconAriaLabel: '',
    };

    const profileActions = [
        { type: 'button', href: ROUTES.USER.DETAILS.FORMAT(userName), id: 'settings', text: t('common.settings') },
        { type: 'button', href: ROUTES.LOGOUT, id: 'signout', text: t('common.sign_out') },
    ];

    const onChangeToolHandler: GenericAppLayoutProps['onToolsChange'] = ({ detail: { open } }) => {
        if (!open) dispatch(closeToolsPanel());
    };

    const onChangeToolsTab = (tabName: ToolsTabs) => {
        dispatch(setToolsTab(tabName));
    };

    const toggleTutorialPanel = () => {
        if (process.env.UI_VERSION !== 'sky') {
            return;
        }

        if (toolsIsOpen) {
            dispatch(closeToolsPanel());
            return;
        }

        dispatch(openTutorialPanel());
    };

    const isVisibleInfoTab = helpPanelContent.header || helpPanelContent.footer || helpPanelContent.body;

    const avatarProps = process.env.UI_VERSION === 'enterprise' ? { name: userName } : { githubHandle: userName };

    const onChangeSystemModeToggle: SideNavigationProps['onFollow'] = (event) => {
        event.preventDefault();

        switch (systemMode) {
            case 'system':
                dispatch(setSystemMode(Mode.Light));
                return;
            case Mode.Light:
                dispatch(setSystemMode(Mode.Dark));
                return;
            default:
                dispatch(setSystemMode(null));
        }
    };

    const ThemeIcon = THEME_ICON_MAP[systemMode];

    return (
        <AnnotationContext>
            <HeaderPortal>
                <div className={styles.appHeader}>
                    <TopNavigation
                        i18nStrings={i18nStrings}
                        identity={{
                            href: '/',
                            logo: { src: logo, alt: 'Dstack logo' },
                        }}
                        utilities={[
                            process.env.UI_VERSION === 'sky' && {
                                type: 'button',
                                iconName: 'gen-ai',
                                title: t('common.tutorial_other'),
                                onClick: toggleTutorialPanel,
                            },
                            {
                                type: 'button',
                                text: t('common.docs'),
                                external: true,
                                onClick: () => goToUrl(DOCS_URL, true),
                            },
                            {
                                type: 'button',
                                text: t('common.discord'),
                                external: true,
                                onClick: () => goToUrl(DISCORD_URL, true),
                            },
                            isAvailableProjectDropdown && {
                                type: 'menu-dropdown',
                                iconName: 'share',
                                text: selectedProject,
                                items: projectsDropdownList,
                                onItemFollow: onFollowProject,
                            },
                            {
                                type: 'button',
                                iconSvg: <ThemeIcon className={styles.themeIcon} />,
                                onClick: onChangeSystemModeToggle,
                            },

                            {
                                'data-class': 'user-menu',
                                type: 'menu-dropdown',
                                text: (
                                    <div className={styles.userAvatar}>
                                        <Avatar {...avatarProps} size="40px" />
                                    </div>
                                ),
                                items: profileActions,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                onItemFollow: onFollowHandler,
                            },
                        ].filter(Boolean)}
                    />
                </div>
            </HeaderPortal>

            <GenericAppLayout
                headerSelector="#header"
                contentType="default"
                content={children}
                splitPanelOpen
                breadcrumbs={renderBreadcrumbs()}
                notifications={<Notifications />}
                navigation={
                    <SideNavigation
                        header={{ href: '#', text: t('common.control_plane') }}
                        activeHref={activeHref}
                        items={navLinks}
                        onFollow={onFollowHandler}
                    />
                }
                tools={
                    <>
                        <Tabs
                            activeTabId={toolsActiveTab}
                            onChange={(event) => onChangeToolsTab(event.detail.activeTabId as ToolsTabs)}
                            tabs={[
                                isVisibleInfoTab && {
                                    id: ToolsTabs.INFO,
                                    label: t('common.info'),
                                    content: (
                                        <HelpPanel header={helpPanelContent.header} footer={helpPanelContent.footer}>
                                            {helpPanelContent.body}
                                        </HelpPanel>
                                    ),
                                },
                                process.env.UI_VERSION === 'sky' && {
                                    id: ToolsTabs.TUTORIAL,
                                    label: t('common.tutorial_other'),
                                    content: (
                                        <TutorialPanel
                                            onFeedbackClick={() =>
                                                window.prompt('Please enter your feedback here (this will not be saved):')
                                            }
                                        />
                                    ),
                                },
                            ].filter(Boolean)}
                        />
                    </>
                }
                toolsHide={!toolsIsOpen}
                toolsOpen={toolsIsOpen}
                toolsWidth={330}
                onToolsChange={onChangeToolHandler}
            />

            <TallyComponent />
        </AnnotationContext>
    );
};

export default AppLayout;
