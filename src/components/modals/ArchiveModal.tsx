import { useEffect, useState } from 'react';
import { getBackupHistory, restoreFromBackup } from '../../lib/archive';
import type { ArchiveSnapshot } from '../../types';

interface ArchiveModalProps {
  onClose: () => void;
  onRestore: (tasks: any[], taskDetails: Map<any, any>, dailyTodos: string[]) => void;
}

export default function ArchiveModal({ onClose, onRestore }: ArchiveModalProps) {
  const [backups, setBackups] = useState<ArchiveSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const history = await getBackupHistory();
      setBackups(history);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (snapshotId: string) => {
    if (!confirm('Möchtest du wirklich zu diesem Backup zurückkehren? Deine aktuellen Daten werden überschrieben.')) {
      return;
    }

    setRestoring(snapshotId);
    try {
      const restored = await restoreFromBackup(snapshotId);
      if (restored) {
        onRestore(restored.tasks, restored.taskDetails, restored.dailyTodos);
        alert('✅ Backup erfolgreich wiederhergestellt!');
        onClose();
      } else {
        alert('❌ Fehler beim Wiederherstellen des Backups');
      }
    } catch (error) {
      console.error('Error restoring:', error);
      alert('❌ Fehler beim Wiederherstellen des Backups');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTypeIcon = (type: 'morning' | 'evening') => {
    return type === 'morning' ? '☀️' : '🌙';
  };

  const getTypeLabel = (type: 'morning' | 'evening') => {
    return type === 'morning' ? 'Morgens' : 'Abends';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fdf0d5] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#669bbc]/30">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#780000] flex items-center gap-3">
              <span className="text-3xl">📦</span>
              Archiv & Backups
            </h2>
            <button
              onClick={onClose}
              className="text-[#003049]/60 hover:text-[#c1121f] text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-[#003049]/70 mt-2">
            Automatische Backups: Morgens (6-10 Uhr) und Abends (18-22 Uhr)
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[#003049]/60 text-lg">Lade Backups...</div>
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-6xl mb-4">📦</span>
              <p className="text-[#003049]/60 text-lg">Noch keine Backups vorhanden</p>
              <p className="text-sm text-[#003049]/50 mt-2">
                Backups werden automatisch morgens und abends erstellt
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-[#669bbc]/30 hover:border-[#669bbc] transition-all hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(backup.type)}</span>
                        <div>
                          <div className="font-bold text-[#003049]">
                            {getTypeLabel(backup.type)} - {formatDate(backup.timestamp)}
                          </div>
                          <div className="text-sm text-[#003049]/60 mt-1">
                            {backup.tasks.length} Tasks • {Object.keys(backup.taskDetails).length} Details • {backup.dailyTodos.length} Daily Todos
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(backup.id)}
                      disabled={restoring !== null}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        restoring === backup.id
                          ? 'bg-[#669bbc]/50 text-white cursor-wait'
                          : 'bg-gradient-to-r from-[#669bbc] to-[#003049] text-white hover:shadow-lg hover:shadow-[#669bbc]/30 hover:scale-105'
                      }`}
                    >
                      {restoring === backup.id ? 'Lädt...' : '🔄 Wiederherstellen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#669bbc]/30 bg-[#669bbc]/10">
          <div className="text-xs text-[#003049]/60 text-center">
            💡 Tipp: Es werden die letzten 30 Backups (15 Tage) gespeichert
          </div>
        </div>
      </div>
    </div>
  );
}
