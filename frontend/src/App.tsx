import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import {
  useAuth, useDiary, usePain, useCbt, useDbt, useDashboard, useMemorableDays,
  useMoneyDashboard, useMoneyMovements, useMoneySettings, useMoneySnapshots, useMoneyTransactions, useSettings,
} from "./hooks";
import { LoginScreen } from "./app/LoginScreen";
import { Sidebar } from "./app/Sidebar";
import { DashboardSection } from "./app/DashboardSection";
import { SectionErrorBoundary } from "./app/ErrorBoundary";
import {
  formatDocumentTitle, navItemsByRealm, navLabels, readStoredRealm, realmOf,
  REALM_STORAGE_KEY, type NavItem,
} from "./app/core";

// The Dashboard is the default view and stays eager so the first paint after
// login has no loading flash. The other sections are reached only via nav, so
// they are lazy-loaded — this keeps each section's form code and its heaviest
// dependency (memorable-days pulls in the full emoji dataset) out of the
// initial bundle until the user actually opens that section.
const DiarySection = lazy(() => import("./app/DiarySection").then((m) => ({ default: m.DiarySection })));
const PainSection = lazy(() => import("./app/PainSection").then((m) => ({ default: m.PainSection })));
const CbtSection = lazy(() => import("./app/CbtSection").then((m) => ({ default: m.CbtSection })));
const DbtSection = lazy(() => import("./app/DbtSection").then((m) => ({ default: m.DbtSection })));
const SettingsSection = lazy(() => import("./app/SettingsSection").then((m) => ({ default: m.SettingsSection })));
const MemorableDaysSection = lazy(() => import("./app/memorable-days").then((m) => ({ default: m.MemorableDaysSection })));
const TransactionsSection = lazy(() => import("./app/money/TransactionsSection").then((m) => ({ default: m.TransactionsSection })));
const MovementsSection = lazy(() => import("./app/money/MovementsSection").then((m) => ({ default: m.MovementsSection })));
const SnapshotsSection = lazy(() => import("./app/money/SnapshotsSection").then((m) => ({ default: m.SnapshotsSection })));
const MoneyDashboardSection = lazy(() => import("./app/money/MoneyDashboardSection").then((m) => ({ default: m.MoneyDashboardSection })));

function App() {
  const auth = useAuth();
  const loggedIn = !!auth.user;
  // The realm is derived from the nav item (money's items are `money-`
  // prefixed), so there is only one piece of state to keep straight. The
  // last realm is remembered so a reload lands you back where you were.
  const [nav, setNav] = useState<NavItem>(() => navItemsByRealm[readStoredRealm()][0]);
  const realm = realmOf(nav);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Mirror of mobileSidebarOpen for the swipe handler closure to read,
  // so the swipe useEffect can run once at mount instead of re-running
  // every time the sidebar opens or closes.
  const mobileSidebarOpenRef = useRef(mobileSidebarOpen);
  useEffect(() => { mobileSidebarOpenRef.current = mobileSidebarOpen; }, [mobileSidebarOpen]);

  // When the drawer opens, move focus to its close button (so keyboard
  // and screen-reader users land inside the drawer). When it closes, return
  // focus to the hamburger that opened it. The ref guards against auto-
  // focusing anything on initial mount.
  const drawerWasOpenRef = useRef(false);
  useEffect(() => {
    if (mobileSidebarOpen) {
      drawerWasOpenRef.current = true;
      document.querySelector<HTMLButtonElement>(".sidebar-close-btn")?.focus();
    } else if (drawerWasOpenRef.current) {
      drawerWasOpenRef.current = false;
      document.querySelector<HTMLButtonElement>(".mobile-menu-btn")?.focus();
    }
  }, [mobileSidebarOpen]);

  // While the drawer is open: Esc closes it, and Tab cycles focus only
  // among the drawer's interactive elements (focus trap).
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const sidebar = document.querySelector<HTMLElement>(".sidebar");
      if (!sidebar) return;
      const focusables = sidebar.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active && !sidebar.contains(active)) {
        // Focus drifted outside the drawer somehow — pull it back.
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileSidebarOpen]);

  // Reset the page scroll position to the top whenever the user navigates
  // to a different screen, so the new page doesn't start mid-scroll.
  // The actual scroll container is the document element (<html>), not
  // .app-main — that one has overflow-y: auto in CSS but no constrained
  // height, so it never actually overflows.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [nav]);

  useEffect(() => {
    document.title = loggedIn
      ? formatDocumentTitle(navLabels[nav], realm)
      : formatDocumentTitle("Sign in");
  }, [loggedIn, nav, realm]);

  // Drive the accent (see :root[data-realm] in styles.css) and remember the
  // choice. index.html replays it before first paint to avoid a flash of the
  // wrong accent; keep the two lists of realm ids in sync.
  useEffect(() => {
    document.documentElement.dataset.realm = realm;
    try {
      localStorage.setItem(REALM_STORAGE_KEY, realm);
    } catch {
      // Persisting is best-effort; the live attribute change still applies.
    }
  }, [realm]);

  const diary = useDiary(loggedIn);
  const pain = usePain(loggedIn);
  const cbt = useCbt(loggedIn);
  const dbt = useDbt(loggedIn);
  const dashboard = useDashboard(loggedIn);
  const memorable = useMemorableDays(loggedIn);
  const settings = useSettings(loggedIn);
  // Only fetched once you're actually in the Money realm — the health realm
  // has no use for it and shouldn't pay for the request.
  const moneyTx = useMoneyTransactions(loggedIn && realm === "money");
  const moneyMovements = useMoneyMovements(loggedIn && nav === "money-movements");
  const moneySnapshots = useMoneySnapshots(loggedIn && nav === "money-snapshots");
  const moneySettings = useMoneySettings(loggedIn && nav === "settings-money");
  const moneyDashboard = useMoneyDashboard(loggedIn && nav === "money-dashboard");

  // Interactive swipe gestures: the sidebar follows the finger 1:1 during
  // the drag, then snaps open or closed on release based on how far it moved.
  useEffect(() => {
    const MOBILE_MAX_WIDTH = 720;
    const ACTIVATE_DX = 8;     // min horizontal travel before we hijack the gesture
    const MAX_VERTICAL = 40;   // give up if the user is clearly scrolling vertically

    const isInsideHorizontalScroller = (el: EventTarget | null) => {
      let node = el as HTMLElement | null;
      while (node && node !== document.body) {
        if (node.scrollWidth > node.clientWidth) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === "auto" || overflowX === "scroll") return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const getSidebar = () => document.querySelector<HTMLElement>(".sidebar");

    let startX = 0;
    let startY = 0;
    let width = 0;
    let tracking: "open" | "close" | null = null;
    let dragging = false;  // becomes true once we commit to a horizontal swipe
    let pendingCleanupTimer: number | null = null;
    let pendingCleanup: (() => void) | null = null;

    // Cancel any pending snap-animation cleanup from a previous gesture so it
    // can't fire mid-drag and wipe inline styles we're actively writing.
    const cancelPendingCleanup = () => {
      if (pendingCleanupTimer !== null) {
        window.clearTimeout(pendingCleanupTimer);
        pendingCleanupTimer = null;
      }
      if (pendingCleanup) {
        const el = getSidebar();
        if (el) el.removeEventListener("transitionend", pendingCleanup);
        pendingCleanup = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > MOBILE_MAX_WIDTH) return;
      cancelPendingCleanup();
      // Clear any leftover inline styles from a previous gesture
      const el = getSidebar();
      if (el) {
        el.style.transform = "";
        el.style.transition = "";
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      width = window.innerWidth;
      dragging = false;
      if (mobileSidebarOpenRef.current) {
        tracking = "close";
      } else if (!isInsideHorizontalScroller(e.target)) {
        tracking = "open";
      } else {
        tracking = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (!dragging) {
        // Wait for clear horizontal intent before hijacking the gesture.
        if (Math.abs(dy) > MAX_VERTICAL) { tracking = null; return; }
        if (Math.abs(dx) < ACTIVATE_DX) return;
        if (Math.abs(dy) > Math.abs(dx)) { tracking = null; return; }
        // Wrong-direction swipes are pointless: bail.
        if (tracking === "open" && dx < 0) { tracking = null; return; }
        if (tracking === "close" && dx > 0) { tracking = null; return; }
        dragging = true;
        const el = getSidebar();
        if (el) el.style.transition = "none";  // disable CSS transition during drag
      }
      const el = getSidebar();
      if (!el) return;
      // Compute the live position. Open gesture starts at -width, close at 0.
      const base = tracking === "open" ? -width : 0;
      const pos = Math.min(0, Math.max(-width, base + dx));
      el.style.transform = `translateX(${pos}px)`;
    };

    const onTouchEnd = () => {
      if (!tracking) { dragging = false; return; }
      const el = getSidebar();
      if (el && dragging) {
        // Read the live position from the inline transform we just set.
        const matrix = new DOMMatrixReadOnly(el.style.transform || "translateX(0)");
        const pos = matrix.m41;
        // Commit threshold: 1/3 of screen width.
        // Open gesture commits once the sidebar is dragged at least 1/3 in (pos > -width * 2/3).
        // Close gesture commits once it's pushed at least 1/3 out (pos < -width * 1/3).
        const shouldOpen = tracking === "open"
          ? pos > -width * (2 / 3)
          : pos > -width * (1 / 3);
        // Re-enable the transition and set inline transform to the destination.
        // Inline style overrides the CSS class, so we'll snap-animate to it,
        // and then clear the inline style after the animation finishes so the
        // CSS class takes back control.
        el.style.transition = "";
        el.style.transform = shouldOpen ? "translateX(0)" : `translateX(-${width}px)`;
        const cleanup = () => {
          el.style.transform = "";
          el.style.transition = "";
          el.removeEventListener("transitionend", cleanup);
          if (pendingCleanupTimer !== null) {
            window.clearTimeout(pendingCleanupTimer);
            pendingCleanupTimer = null;
          }
          pendingCleanup = null;
        };
        pendingCleanup = cleanup;
        el.addEventListener("transitionend", cleanup);
        // Safety: if no transition fires (e.g. inline matches CSS exactly), clean up anyway.
        pendingCleanupTimer = window.setTimeout(cleanup, 350);

        if (shouldOpen !== mobileSidebarOpenRef.current) {
          setMobileSidebarOpen(shouldOpen);
        }
      }
      tracking = null;
      dragging = false;
    };

    // All listeners can be passive: vertical-scroll blocking is handled
    // declaratively via `body { touch-action: pan-y }` in the mobile media
    // query, so we never need preventDefault().
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      cancelPendingCleanup();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
    // Empty dep array — handlers read live state via mobileSidebarOpenRef so
    // we only need to attach the listeners once at mount.
  }, []);

  // The app ships only dark themes (dark, grey, oled — see themeIds in app/core.ts),
  // so the toaster is pinned to "dark" to match. There is no light mode to follow.
  const toaster = <Toaster theme="dark" richColors position="bottom-right" />;

  if (!auth.user) {
    return (
      <>
        <LoginScreen loginForm={auth.loginForm} loginMutation={auth.loginMutation} />
        {toaster}
      </>
    );
  }

  return (
    <>
    <div className={`grid grid-cols-[220px_1fr] min-h-screen transition-[grid-template-columns] duration-[250ms] ease-[ease] max-mobile:grid-cols-1 ${sidebarCollapsed ? "mobile:grid-cols-[62px_1fr]" : ""} ${mobileSidebarOpen ? "max-mobile:h-[100dvh] max-mobile:overflow-hidden" : ""}`}>
      <Sidebar
        nav={nav}
        onNav={(item) => { setNav(item); setMobileSidebarOpen(false); }}
        realm={realm}
        onRealmChange={(next) => setNav(navItemsByRealm[next][0])}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        mobileOpen={mobileSidebarOpen}
      />

      <main className={`max-w-[1500px] w-full overflow-y-auto [padding:clamp(20px,4vw,40px)] max-mobile:p-5 ${mobileSidebarOpen ? "max-mobile:overflow-hidden" : ""}`}>
        <button
          type="button"
          className="mobile-menu-btn hidden max-mobile:flex max-mobile:items-center max-mobile:justify-center w-[40px] h-[40px] max-mobile:mb-3 max-mobile:ml-2 p-0 border-0 rounded-sm bg-card-soft text-muted cursor-pointer shadow-none hover:text-text hover:bg-card-strong"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <SectionErrorBoundary resetKey={nav}>
        <Suspense fallback={<p className="text-muted text-control">Loading…</p>}>
        {nav === "dashboard" && (
          <DashboardSection
            dashboardFrom={dashboard.dashboardFrom} dashboardTo={dashboard.dashboardTo}
            activeQuickRange={dashboard.activeQuickRange} isLoading={dashboard.isLoading}
            hasEntriesInRange={dashboard.hasEntriesInRange} hasEntriesOverall={dashboard.hasEntriesOverall}
            onDateChange={dashboard.handleDateChange}
            onQuickRange={dashboard.applyQuickRange}
            dashboardCards={dashboard.dashboardCards} dashboardInsights={dashboard.dashboardInsights}
            dashboardConnections={dashboard.dashboardConnections}
            wellbeingSeries={dashboard.wellbeingSeries} graphSelection={dashboard.graphSelection}
            onGraphToggle={dashboard.handleGraphToggle} wellbeingChart={dashboard.wellbeingChart}
            anniversaryCards={memorable.todayItems}
          />
        )}

        {nav === "memorable-days" && <MemorableDaysSection memorable={memorable} />}

        {nav === "diary" && (
          <DiarySection
            diaryForm={diary.diaryForm} diaryMutationState={{ isSuccess: diary.diaryMutation.isSuccess }} isLoading={diary.isLoading}
            editingDiary={diary.editingDiary} moodFieldOptions={diary.moodFieldOptions}
            diaryEntries={diary.diaryEntries} confirmDeleteDiary={diary.confirmDeleteDiary}
            onSubmit={(v) => diary.diaryMutation.mutate(v)} onCancelEdit={diary.resetDiaryForm}
            onStartEdit={diary.startDiaryEdit} onDeleteClick={diary.onDeleteClick} onDeleteBlur={diary.onDeleteBlur}
          />
        )}

        {nav === "pain" && (
          <PainSection
            painForm={pain.painForm} painMutationState={{ isSuccess: pain.painMutation.isSuccess }} isLoading={pain.isLoading}
            editingPain={pain.editingPain} painFieldOptions={pain.painFieldOptions}
            watchedValues={pain.watchedValues} painEntries={pain.painEntries}
            confirmDeletePain={pain.confirmDeletePain} onSubmit={(v) => pain.painMutation.mutate(v)}
            onCancelEdit={pain.resetPainForm} onStartEdit={pain.startPainEdit}
            onDeleteClick={pain.onDeleteClick} onDeleteBlur={pain.onDeleteBlur}
          />
        )}

        {nav === "cbt" && (
          <CbtSection
            cbtForm={cbt.cbtForm} cbtMutationState={{ isSuccess: cbt.cbtMutation.isSuccess }} isLoading={cbt.isLoading}
            editingCbt={cbt.editingCbt} cbtEntries={cbt.cbtEntries}
            confirmDeleteCbt={cbt.confirmDeleteCbt} onSubmit={(v) => cbt.cbtMutation.mutate(v)}
            onCancelEdit={cbt.resetCbtForm} onStartEdit={cbt.startCbtEdit}
            onDeleteClick={cbt.onDeleteClick} onDeleteBlur={cbt.onDeleteBlur}
          />
        )}

        {nav === "dbt" && (
          <DbtSection
            dbtForm={dbt.dbtForm} dbtMutationState={{ isSuccess: dbt.dbtMutation.isSuccess }} isLoading={dbt.isLoading}
            editingDbt={dbt.editingDbt} dbtEntries={dbt.dbtEntries}
            confirmDeleteDbt={dbt.confirmDeleteDbt} onSubmit={(v) => dbt.dbtMutation.mutate(v)}
            onCancelEdit={dbt.resetDbtForm} onStartEdit={dbt.startDbtEdit}
            onDeleteClick={dbt.onDeleteClick} onDeleteBlur={dbt.onDeleteBlur}
          />
        )}

        {nav === "money-transactions" && (
          <TransactionsSection
            txForm={moneyTx.txForm} txMutationState={{ isSuccess: moneyTx.txMutation.isSuccess }}
            isLoading={moneyTx.isLoading} editingTx={moneyTx.editingTx}
            transactions={moneyTx.transactions} assetOptions={moneyTx.assetOptions}
            confirmDeleteTx={moneyTx.confirmDeleteTx}
            onSubmit={(v) => moneyTx.txMutation.mutate(v)} onCancelEdit={moneyTx.resetTxForm}
            onStartEdit={moneyTx.startTxEdit} onDeleteClick={moneyTx.onDeleteClick}
            onDeleteBlur={moneyTx.onDeleteBlur}
          />
        )}

        {nav === "money-movements" && (
          <MovementsSection
            movementForm={moneyMovements.movementForm}
            movementMutationState={{ isSuccess: moneyMovements.movementMutation.isSuccess }}
            isLoading={moneyMovements.isLoading} editingMovement={moneyMovements.editingMovement}
            movements={moneyMovements.movements} confirmDeleteMovement={moneyMovements.confirmDeleteMovement}
            onSubmit={(v) => moneyMovements.movementMutation.mutate(v)}
            onCancelEdit={moneyMovements.resetMovementForm} onStartEdit={moneyMovements.startMovementEdit}
            onDeleteClick={moneyMovements.onDeleteClick} onDeleteBlur={moneyMovements.onDeleteBlur}
          />
        )}

        {nav === "money-snapshots" && (
          <SnapshotsSection
            snapshotForm={moneySnapshots.snapshotForm}
            snapshotMutationState={{ isSuccess: moneySnapshots.snapshotMutation.isSuccess }}
            isLoading={moneySnapshots.isLoading} canSave={moneySnapshots.canSave}
            snapshots={moneySnapshots.snapshots} confirmDeleteSnapshot={moneySnapshots.confirmDeleteSnapshot}
            onSubmit={(v) => moneySnapshots.snapshotMutation.mutate(v)}
            onDeleteClick={moneySnapshots.onDeleteClick} onDeleteBlur={moneySnapshots.onDeleteBlur}
          />
        )}

        {nav === "money-dashboard" && <MoneyDashboardSection {...moneyDashboard} />}

        {realm === "settings" && (
          <SettingsSection nav={nav} money={moneySettings} auth={auth}
            birthday={settings.prefsValue.birthday ?? null}
            birthdayPending={settings.prefsMutation.isPending}
            onSaveBirthday={settings.onSaveBirthday}
            purgeConfirmArmed={settings.purgeConfirmArmed}
            purgePending={settings.purgePending} purgeError={settings.purgeError}
            onPurgeArm={settings.onPurgeArm} onPurgeConfirm={settings.onPurgeConfirm}
            onPurgeCancel={settings.onPurgeCancel} onExportJson={settings.onExportJson}
            onImportJson={settings.onImportJson} onExportXlsx={settings.onExportXlsx}
            onImportXlsx={settings.onImportXlsx}
          />
        )}

        </Suspense>
        </SectionErrorBoundary>
      </main>
    </div>
    {toaster}
    </>
  );
}

export default App;
