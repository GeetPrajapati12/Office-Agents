import React from 'react'
import { ApprovalRequest } from '@shared/types/ipc'

interface ApprovalDialogProps {
  request: ApprovalRequest | null
  onRespond: (requestId: string, approved: boolean) => void
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({ request, onRespond }) => {
  if (!request) return null

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <section
        className="snes-panel"
        style={{
          width: '460px',
          maxWidth: '90vw',
          backgroundColor: 'var(--paper-200)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              color: 'var(--lemon)',
              letterSpacing: '0.05em'
            }}
          >
            ACTION APPROVAL REQUIRED
          </h2>
        </div>

        <div
          className="snes-panel-inset"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            padding: '12px'
          }}
        >
          <div>
            <span style={{ color: 'var(--ink-300)' }}>Agent: </span>
            <span style={{ color: 'var(--lilac)', fontWeight: 'bold' }}>
              {request.agentId.toUpperCase()}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--ink-300)' }}>Action: </span>
            <span style={{ color: 'var(--coral)', fontWeight: 'bold' }}>
              {request.action}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--ink-300)' }}>Description: </span>
            <span style={{ color: 'var(--cream-100)' }}>
              {request.description}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--ink-300)' }}>Reason: </span>
            <span style={{ color: 'var(--cream-200)', fontStyle: 'italic' }}>
              {request.reason}
            </span>
          </div>
          {request.costEstimate !== undefined && (
            <div>
              <span style={{ color: 'var(--ink-300)' }}>Estimated Cost: </span>
              <span style={{ color: 'var(--mint)' }}>${request.costEstimate.toFixed(4)}</span>
            </div>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--ink-300)',
            fontFamily: 'var(--font-ui)'
          }}
        >
          Do you authorize the orchestrator to proceed with this operation?
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            className="snes-button"
            onClick={() => onRespond(request.id, false)}
            style={{
              backgroundColor: 'var(--ink-700)',
              color: 'var(--coral)',
              borderColor: 'var(--coral)'
            }}
          >
            ✖ Deny / Cancel
          </button>
          <button
            className="snes-button snes-button-primary"
            onClick={() => onRespond(request.id, true)}
            style={{
              backgroundColor: 'var(--mint)',
              color: 'var(--ink-900)'
            }}
          >
            ✔ Approve &amp; Execute
          </button>
        </div>
      </section>
    </div>
  )
}
