  const [toggling,  setToggling]  = useState(false);
  const [openToFin, setOpenToFin] = useState(settings.open_to_financing);

  // Keep local toggle in sync whenever the parent re-fetches settings
  useEffect(() => {
    setOpenToFin(settings.open_to_financing);
  }, [settings.open_to_financing]);

  const handleToggleDiscovery = async (v: boolean) => {
    setOpenToFin(v);        // optimistic UI
    setToggling(true);
    try {
      await apiCall("update-account-settings", {
        body: { action: "update_open_to_financing", open_to_financing: v },
      });
      onRefresh();          // sync parent so financing page picks up the change
    } catch {
      setOpenToFin(!v);     // revert on error
    } finally {
      setToggling(false);
    }
  };