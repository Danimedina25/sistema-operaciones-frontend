import { useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { OperationDetailContainer } from '../components/OperationDetailContainer';

export default function OperationDetailPage() {
  const navigate = useNavigate();
  const { operationId } = useParams<{ operationId: string }>();

  const parsedOperationId = Number(operationId);

  if (!operationId || Number.isNaN(parsedOperationId)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        El identificador de la operación no es válido.
      </div>
    );
  }

  return (
    <OperationDetailContainer
      operationId={parsedOperationId}
      onBack={() => navigate(paths.operations)}
    />
  );
}