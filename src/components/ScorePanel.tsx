import { Card, Progress, Tooltip, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import type { AnalysisResult } from '@/lib/content-analyzer';

const { Text } = Typography;

const GRADE_LABEL = {
  poor: 'Kém',
  fair: 'Trung bình',
  good: 'Tốt',
  great: 'Xuất sắc',
};

type Props = {
  result: AnalysisResult;
  title?: string;
};

export default function ScorePanel({ result, title = 'Điểm chất lượng' }: Props) {
  const pct = Math.round((result.score / result.maxScore) * 100);

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <Text strong style={{ color: result.color, fontSize: 18 }}>
              {result.score}/{result.maxScore}
            </Text>
            <Text
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: result.color }}
            >
              {GRADE_LABEL[result.grade]}
            </Text>
          </div>
        </div>
      }
    >
      <Progress
        percent={pct}
        strokeColor={result.color}
        trailColor="#f0f0f0"
        showInfo={false}
        size="small"
        className="mb-3"
      />

      <div className="space-y-1">
        {result.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.passed ? (
                <CheckCircleFilled style={{ color: '#22c55e', flexShrink: 0 }} />
              ) : (
                <CloseCircleFilled style={{ color: item.earned > 0 ? '#f59e0b' : '#ef4444', flexShrink: 0 }} />
              )}
              <span className={`truncate ${item.passed ? 'text-gray-700' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {item.tip && (
                <Tooltip title={item.tip}>
                  <InfoCircleOutlined className="text-gray-400 flex-shrink-0" style={{ fontSize: 12 }} />
                </Tooltip>
              )}
            </div>
            <Text
              className="ml-2 flex-shrink-0 text-xs"
              style={{ color: item.passed ? '#22c55e' : item.earned > 0 ? '#f59e0b' : '#9ca3af' }}
            >
              {item.earned}/{item.points}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
