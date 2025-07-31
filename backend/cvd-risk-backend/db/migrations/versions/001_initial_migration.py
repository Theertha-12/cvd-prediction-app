"""Initial migration
Revision ID: 001
Revises:
Create Date: 2023-10-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('users',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('email', sa.String(length=255), nullable=False),
                    sa.Column('hashed_password', sa.String(length=255), nullable=False),
                    sa.Column('full_name', sa.String(length=255), nullable=False),
                    sa.Column('role', sa.String(length=50), server_default='patient', nullable=True),
                    sa.Column('is_active', sa.Boolean(), server_default='1', nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
                    sa.Column('last_login', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('email')
                    )

    op.create_table('predictions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('sex', sa.Integer(), nullable=False),
                    sa.Column('age', sa.Integer(), nullable=False),
                    sa.Column('cigs_per_day', sa.Integer(), nullable=False),
                    sa.Column('tot_chol', sa.Float(), nullable=False),  # Fixed typo: 'cho!' → 'chol'
                    sa.Column('sys_bp', sa.Float(), nullable=False),
                    sa.Column('dia_bp', sa.Float(), nullable=False),
                    sa.Column('glucose', sa.Float(), nullable=False),
                    sa.Column('probability', sa.Float(), nullable=False),
                    sa.Column('risk_percentage', sa.Float(), nullable=False),
                    sa.Column('risk_category', sa.String(length=50), nullable=False),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )

    op.create_table('chat_sessions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('session_id', sa.String(length=255), nullable=False),
                    sa.Column('session_name', sa.String(length=255), server_default='New Chat', nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
                    sa.Column('updated_at', sa.DateTime(),
                              server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('session_id')
                    )

    op.create_table('batch_predictions',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('user_id', sa.Integer(), nullable=False),
                    sa.Column('filename', sa.String(length=255), nullable=False),
                    sa.Column('total_records', sa.Integer(), nullable=False),
                    sa.Column('successful_predictions', sa.Integer(), nullable=False),
                    sa.Column('failed_predictions', sa.Integer(), nullable=False),
                    sa.Column('results', sa.Text(), nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
                    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )

    op.create_table('chat_messages',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('session_id', sa.String(length=255), nullable=False),
                    sa.Column('message', sa.Text(), nullable=False),
                    sa.Column('response', sa.Text(), nullable=False),
                    sa.Column('source', sa.String(length=50), server_default='ai', nullable=True),
                    sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
                    sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('id')
                    )

    op.create_index('idx_predictions_user_id', 'predictions', ['user_id'])
    op.create_index('idx_predictions_created_at', 'predictions', ['created_at'])
    op.create_index('idx_chat_sessions_user_id', 'chat_sessions', ['user_id'])
    op.create_index('idx_batch_predictions_user_id', 'batch_predictions', ['user_id'])


def downgrade():
    op.drop_table('chat_messages')
    op.drop_table('batch_predictions')
    op.drop_table('chat_sessions')
    op.drop_table('predictions')
    op.drop_table('users')