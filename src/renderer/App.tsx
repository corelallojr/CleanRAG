import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./lib/api";
import { useRuntimeConfig } from "./hooks/useRuntimeConfig";
import { Shell, type NavView } from "./components/Shell";
import { SetupChecklist } from "./components/SetupChecklist";
import { ProjectsPanel } from "./components/ProjectsPanel";
import { ChatsPanel } from "./components/ChatsPanel";
import { SourcesPanel } from "./components/SourcesPanel";
import { ModelsPanel } from "./components/ModelsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import type { ProjectRecord } from "../shared";

export function App(): JSX.Element {
  const runtimeConfig = useRuntimeConfig();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<NavView>("chats");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const setupQuery = useQuery({
    queryKey: ["setup-status"],
    queryFn: api.getSetupStatus,
    enabled: runtimeConfig !== null,
    retry: false
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: runtimeConfig !== null
  });

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.getModels,
    enabled: runtimeConfig !== null
  });

  const activeProject = useMemo<ProjectRecord | null>(() => {
    return projectsQuery.data?.find((project) => project.id === activeProjectId) ?? projectsQuery.data?.[0] ?? null;
  }, [activeProjectId, projectsQuery.data]);

  useEffect(() => {
    if (!activeProjectId && projectsQuery.data && projectsQuery.data.length > 0) {
      setActiveProjectId(projectsQuery.data[0].id);
    }
  }, [activeProjectId, projectsQuery.data]);

  const chatsQuery = useQuery({
    queryKey: ["chats", activeProject?.id],
    queryFn: () => api.getChats(activeProject!.id),
    enabled: Boolean(activeProject?.id)
  });

  const sourcesQuery = useQuery({
    queryKey: ["sources", activeProject?.id],
    queryFn: () => api.getSources(activeProject!.id),
    enabled: Boolean(activeProject?.id)
  });

  useEffect(() => {
    if (!activeChatId && chatsQuery.data && chatsQuery.data.length > 0) {
      setActiveChatId(chatsQuery.data[0].id);
    }
  }, [activeChatId, chatsQuery.data]);

  const messagesQuery = useQuery({
    queryKey: ["chat", activeChatId],
    queryFn: () => api.getChatMessages(activeChatId!),
    enabled: Boolean(activeChatId)
  });

  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setActiveProjectId(project.id);
      setActiveView("chats");
    }
  });

  const createChatMutation = useMutation({
    mutationFn: (projectId: string) => api.createChat(projectId, { title: "New chat" }),
    onSuccess: async (chat) => {
      await queryClient.invalidateQueries({ queryKey: ["chats", chat.projectId] });
      setActiveChatId(chat.id);
      setActiveView("chats");
    }
  });

  const respondMutation = useMutation({
    mutationFn: api.respondToChat,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat", activeChatId] });
      await queryClient.invalidateQueries({ queryKey: ["chats", activeProject?.id] });
    }
  });

  const installModelMutation = useMutation({
    mutationFn: (model: string) => api.installModel({ model }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["models"] });
      await queryClient.invalidateQueries({ queryKey: ["setup-status"] });
    }
  });

  const removeModelMutation = useMutation({
    mutationFn: (model: string) => api.removeModel({ model }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["models"] });
      await queryClient.invalidateQueries({ queryKey: ["setup-status"] });
    }
  });

  if (!runtimeConfig) {
    return <div className="loading-screen">Loading desktop runtime...</div>;
  }

  const handleUploadFiles = async (files: File[]): Promise<void> => {
    if (!activeProject) {
      return;
    }
    const formData = new FormData();
    formData.append("project_id", activeProject.id);
    files.forEach((file) => formData.append("files", file));
    await api.uploadSource(formData);
    await queryClient.invalidateQueries({ queryKey: ["sources", activeProject.id] });
  };

  const handlePickFiles = async (): Promise<void> => {
    if (!activeProject) {
      return;
    }
    const filePaths = await window.cleanragDesktop.pickFiles();
    if (filePaths.length === 0) {
      return;
    }
    await api.importSourcePaths({
      projectId: activeProject.id,
      filePaths
    });
    await queryClient.invalidateQueries({ queryKey: ["sources", activeProject.id] });
  };

  const modelNames = (modelsQuery.data ?? []).filter((item) => item.kind === "chat").map((item) => item.tag);

  return (
    <Shell activeView={activeView} onSelectView={setActiveView}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Desktop app</p>
          <h2>Clean local chat and retrieval</h2>
        </div>
      </header>
      {setupQuery.data ? (
        <SetupChecklist
          setupStatus={setupQuery.data}
          hasPython={runtimeConfig.hasPython}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["setup-status"] });
          }}
        />
      ) : null}
      {activeView === "projects" ? (
        <ProjectsPanel
          projects={projectsQuery.data ?? []}
          activeProjectId={activeProject?.id ?? null}
          onSelectProject={(projectId) => {
            setActiveProjectId(projectId);
            setActiveChatId(null);
            setActiveView("chats");
          }}
          onCreateProject={async (input) => {
            await createProjectMutation.mutateAsync(input);
          }}
        />
      ) : null}
      {activeView === "chats" ? (
        <ChatsPanel
          activeProject={activeProject}
          chats={chatsQuery.data ?? []}
          activeChatId={activeChatId}
          messages={messagesQuery.data?.messages ?? []}
          models={modelNames}
          sources={sourcesQuery.data ?? []}
          onSelectChat={setActiveChatId}
          onCreateChat={async () => {
            if (activeProject) {
              await createChatMutation.mutateAsync(activeProject.id);
            }
          }}
          onSendMessage={async (input) => {
            if (!activeProject || !activeChatId) {
              return;
            }
            await respondMutation.mutateAsync({
              projectId: activeProject.id,
              chatId: activeChatId,
              message: input.message,
              model: input.model,
              useRetrieval: input.useRetrieval,
              sourceId: input.sourceId
            });
          }}
        />
      ) : null}
      {activeView === "sources" ? (
        <SourcesPanel
          activeProject={activeProject}
          sources={sourcesQuery.data ?? []}
          onUpload={handleUploadFiles}
          onPickFiles={handlePickFiles}
          onReindex={async (sourceId) => {
            await api.reindexSource(sourceId);
            await queryClient.invalidateQueries({ queryKey: ["sources", activeProject?.id] });
          }}
        />
      ) : null}
      {activeView === "models" ? (
        <ModelsPanel
          models={modelsQuery.data ?? []}
          onInstall={async (model) => {
            await installModelMutation.mutateAsync(model);
          }}
          onRemove={async (model) => {
            await removeModelMutation.mutateAsync(model);
          }}
        />
      ) : null}
      {activeView === "settings" ? <SettingsPanel hasPython={runtimeConfig.hasPython} /> : null}
    </Shell>
  );
}
